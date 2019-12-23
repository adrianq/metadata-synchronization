import memoize from "nano-memoize";
import Instance from "../../models/instance";
import { getEventsData, postEventsData } from "../../utils/synchronization";
import { GenericSync } from "./generic";

export class EventsSync extends GenericSync {
    protected readonly type = "events";

    protected buildPayload = memoize(async () => {
        const { dataParams = {} } = this.builder;
        const { programs = [] } = await this.extractMetadata();

        const events = await getEventsData(
            this.api,
            dataParams,
            programs.map(({ id }) => id)
        );

        return { events };
    });

    protected async postPayload(instance: Instance) {
        const { dataParams = {} } = this.builder;

        const payloadPackage = await this.buildPayload();

        return postEventsData(instance, payloadPackage, dataParams);
    }
}
