import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';

export interface CreateInvoiceParams {
  partnerId: string;
  subscriptionId?: string;
  externalId: string;
  externalProvider: string;
  customerId?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate?: Date;
  invoiceUrl?: string;
  invoicePdf?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateInvoiceParams): Promise<Invoice> {
    return this.prisma.invoice.create({
      data: {
        partnerId: params.partnerId,
        subscriptionId: params.subscriptionId,
        externalId: params.externalId,
        externalProvider: params.externalProvider,
        customerId: params.customerId,
        amount: params.amount,
        currency: params.currency,
        status: params.status,
        dueDate: params.dueDate,
        invoiceUrl: params.invoiceUrl,
        invoicePdf: params.invoicePdf,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async findBypartnerId(partnerId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByExternalId(externalId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: { externalId },
    });
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, status: InvoiceStatus, paidAt?: Date): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt,
      },
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
