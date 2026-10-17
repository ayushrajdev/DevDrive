import Plan from '../../models/plan.model.js';
import type { IPlan } from '../../shared/types/index.js';

export interface IPlanRepository {
    getPlanById(planId: string): Promise<IPlan | null>;
    getAllPlans(): Promise<IPlan[]>;
    createPlan(planData: Partial<IPlan>): Promise<IPlan>;
}

export class MongoPlanRepository implements IPlanRepository {
    async getPlanById(planId: string): Promise<IPlan | null> {
        return Plan.findById(planId).lean() as Promise<IPlan | null>;
    }

    async getAllPlans(): Promise<IPlan[]> {
        return Plan.find().lean() as Promise<IPlan[]>;
    }

    async createPlan(planData: Partial<IPlan>): Promise<IPlan> {
        const plan = await Plan.create(planData);
        return plan.toObject() as unknown as IPlan;
    }
}
