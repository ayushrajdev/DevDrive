import { Schema, model } from 'mongoose';

const webhookSchema = new Schema(
    {
        event: {},
        processed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

//manually process the failed webhook through cron jobs

const Webhook = model('Webhook', webhookSchema);
export default Webhook;
