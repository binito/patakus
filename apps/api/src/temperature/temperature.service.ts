import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { RecordTemperatureDto } from './dto/record-temperature.dto';

@Injectable()
export class TemperatureService {
  constructor(private prisma: PrismaService) {}

  async findAllEquipment(clientId?: string) {
    return this.prisma.temperatureEquipment.findMany({
      where: { active: true, ...(clientId ? { clientId } : {}) },
      orderBy: { name: 'asc' },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async createEquipment(dto: CreateEquipmentDto) {
    return this.prisma.temperatureEquipment.create({ data: dto });
  }

  async updateEquipment(id: string, data: Partial<CreateEquipmentDto>) {
    const eq = await this.prisma.temperatureEquipment.findUnique({ where: { id } });
    if (!eq) throw new NotFoundException('Equipamento não encontrado');
    return this.prisma.temperatureEquipment.update({ where: { id }, data });
  }

  async deleteEquipment(id: string) {
    const eq = await this.prisma.temperatureEquipment.findUnique({ where: { id } });
    if (!eq) throw new NotFoundException('Equipamento não encontrado');
    await this.prisma.temperatureRecord.deleteMany({ where: { equipmentId: id } });
    await this.prisma.temperatureEquipment.delete({ where: { id } });
    return { id };
  }

  async recordTemperature(dto: RecordTemperatureDto, operatorId: string) {
    return this.prisma.temperatureRecord.create({
      data: {
        temperature: dto.temperature,
        session: dto.session,
        notes: dto.notes,
        equipment: { connect: { id: dto.equipmentId } },
        operator: { connect: { id: operatorId } },
      },
    });
  }

  async getRecords(equipmentId?: string, date?: string, clientId?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (equipmentId) {
      where.equipmentId = equipmentId;
    } else if (clientId) {
      where.equipment = { clientId };
    }

    if (startDate || endDate || date) {
      const from = new Date(startDate ?? date!);
      from.setHours(0, 0, 0, 0);
      const to = new Date(endDate ?? date!);
      to.setHours(23, 59, 59, 999);
      where.recordedAt = { gte: from, lte: to };
    }

    return this.prisma.temperatureRecord.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
      include: {
        equipment: { select: { id: true, name: true, type: true, minTemp: true, maxTemp: true, location: true, client: { select: { id: true, name: true } } } },
        operator: { select: { id: true, name: true } },
      },
    });
  }

  // Estado de hoje por equipamento — quais sessões já foram registadas
  async getTodayStatus(clientId: string) {
    const equipment = await this.findAllEquipment(clientId);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todayRecords = await this.prisma.temperatureRecord.findMany({
      where: {
        equipment: { clientId },
        recordedAt: { gte: start, lte: end },
      },
      select: { equipmentId: true, session: true, temperature: true, recordedAt: true },
    });

    return (equipment as any[]).map((eq) => {
      const records = todayRecords.filter((r) => r.equipmentId === eq.id);
      const morning = records.find((r) => r.session === 'MORNING');
      const evening = records.find((r) => r.session === 'EVENING');
      return {
        ...eq,
        today: {
          morning: morning ?? null,
          evening: evening ?? null,
        },
      };
    });
  }
}
