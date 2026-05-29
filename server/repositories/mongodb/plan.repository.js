import Plan from '../../models/plan.model.js';

export default class MongoPlanRepository {
    constructor() {
        this.Plan = Plan;
    }
    async getPlanById({ planId }) {
        const plan = await Plan.findById(planId).lean();
        return plan;
    }
}
