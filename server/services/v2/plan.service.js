import MongoPlanRepository from '../../repositories/mongodb/plan.repository.js';

export default class V2PlanService {
    constructor() {
        this.planRepository = new MongoPlanRepository();
    }

    getProviderPlanId = async ({ id }) => {
        const providerPlanId =
            await this.planRepository.getPaymentProviderPlanId({ id });
        return providerPlanId;
    };
}
