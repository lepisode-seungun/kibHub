import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicantsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findByBootcamp(bootcampId: number) {
    return this.prisma.applicant.findMany({
      where: { bootcampId },
      include: { user: { select: { id: true, name: true, email: true, phone: true, status: true } } },
      orderBy: { appliedAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.applicant.findUnique({
      where: { id },
      include: { user: true, bootcamp: true },
    });
  }

  updateStatus(id: number, status: 'PENDING' | 'ACCEPTED' | 'REJECTED') {
    return this.prisma.applicant.update({ where: { id }, data: { status } });
  }

  bulkUpdateStatus(ids: number[], status: 'ACCEPTED' | 'REJECTED') {
    return this.prisma.applicant.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }
}
