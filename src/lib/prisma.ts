import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: any };

// Instantiate the base Prisma Client
const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Extend the Prisma Client to intercept mutations and perform audit logging
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async create({ model, args, query }) {
        const result = await query(args);

        // Skip logging AuditLog creations to avoid infinite recursion loops
        if (model !== 'AuditLog') {
          try {
            await basePrisma.auditLog.create({
              data: {
                actorId: (args as any).context?.actorId || 'system',
                action: 'CREATE',
                entity: model,
                entityId: (result as any).id || 'unknown',
                oldValues: null,
                newValues: args.data as any,
              },
            });
          } catch (err) {
            console.error('[AuditLog Error] Failed to log CREATE operation:', err);
          }
        }

        return result;
      },

      async update({ model, args, query }) {
        if (model === 'AuditLog') {
          return query(args);
        }

        let oldRecord: any = null;
        try {
          const where = args.where;
          oldRecord = await (basePrisma[model as any] as any).findUnique({ where });
        } catch (err) {
          console.warn('[AuditLog Warning] Could not fetch old record state for UPDATE:', err);
        }

        const result = await query(args);

        try {
          const oldValues: Record<string, any> = {};
          const newValues: Record<string, any> = {};

          if (oldRecord && args.data) {
            for (const key of Object.keys(args.data)) {
              const newVal = (args.data as any)[key];
              const oldVal = oldRecord[key];
              if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                oldValues[key] = oldVal;
                newValues[key] = newVal;
              }
            }
          }

          await basePrisma.auditLog.create({
            data: {
              actorId: (args as any).context?.actorId || 'system',
              action: 'UPDATE',
              entity: model,
              entityId: (result as any).id || 'unknown',
              oldValues: Object.keys(oldValues).length ? oldValues : null,
              newValues: Object.keys(newValues).length ? newValues : null,
            },
          });
        } catch (err) {
          console.error('[AuditLog Error] Failed to log UPDATE operation:', err);
        }

        return result;
      },

      async delete({ model, args, query }) {
        if (model === 'AuditLog') {
          return query(args);
        }

        let oldRecord: any = null;
        try {
          const where = args.where;
          oldRecord = await (basePrisma[model as any] as any).findUnique({ where });
        } catch (err) {
          console.warn('[AuditLog Warning] Could not fetch old record state for DELETE:', err);
        }

        const result = await query(args);

        try {
          await basePrisma.auditLog.create({
            data: {
              actorId: (args as any).context?.actorId || 'system',
              action: 'DELETE',
              entity: model,
              entityId: oldRecord?.id || 'unknown',
              oldValues: oldRecord || null,
              newValues: null,
            },
          });
        } catch (err) {
          console.error('[AuditLog Error] Failed to log DELETE operation:', err);
        }

        return result;
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
