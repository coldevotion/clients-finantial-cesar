import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@wa/database';
import type { FlowNode, FlowEdge } from '@wa/types';
import { NodeType } from '@wa/types';

@Injectable()
export class FlowsService {
  list(tenantId: string) {
    return prisma.flow.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, description: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async findOne(tenantId: string, id: string) {
    const flow = await prisma.flow.findFirst({ where: { id, tenantId } });
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  create(tenantId: string, data: { name: string; description?: string }) {
    return prisma.flow.create({
      data: { tenantId, ...data, nodes: [], edges: [] },
    });
  }

  async updateGraph(tenantId: string, id: string, nodes: FlowNode[], edges: FlowEdge[]) {
    await this.findOne(tenantId, id);
    return prisma.flow.update({ where: { id }, data: { nodes: nodes as any, edges: edges as any } });
  }

  async activate(tenantId: string, id: string) {
    const flow = await this.findOne(tenantId, id);
    const nodes = flow.nodes as unknown as FlowNode[];
    const edges = flow.edges as unknown as FlowEdge[];

    this.validateGraph(nodes, edges);

    return prisma.flow.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return prisma.flow.delete({ where: { id } });
  }

  private validateGraph(nodes: FlowNode[], edges: FlowEdge[]) {
    const triggerNodes = nodes.filter((n) => n.type === NodeType.TRIGGER);
    if (triggerNodes.length !== 1) {
      throw new BadRequestException('Flow must have exactly one trigger node');
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new BadRequestException(`Edge references non-existent node`);
      }
    }
  }
}
