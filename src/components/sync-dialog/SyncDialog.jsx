import React from "react";
import i18n from "@dhis2/d2-i18n";
import PropTypes from "prop-types";
import _ from "lodash";
import { ConfirmationDialog, MultiSelector } from "d2-ui-components";
import { DialogContent } from "@material-ui/core";

import Instance from "../../models/instance";
import SyncParamsSelector from "../sync-params-selector/SyncParamsSelector";

const defaultSyncParams = {
    includeSharingSettings: true,
    atomicMode: "ALL",
    mergeMode: "MERGE",
};

class SyncDialog extends React.Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
        isOpen: PropTypes.bool.isRequired,
        metadataIds: PropTypes.array.isRequired,
        handleClose: PropTypes.func.isRequired,
        task: PropTypes.func.isRequired,
    };

    state = {
        instanceOptions: [],
        targetInstances: [],
        syncParams: defaultSyncParams,
    };

    async componentDidMount() {
        const instances = await Instance.list(
            this.props.d2,
            { search: "" },
            { page: 1, pageSize: 100, sorting: [] }
        );
        const instanceOptions = instances.objects.map(instance => ({
            value: instance.id,
            text: `${instance.name} (${instance.url} with user ${instance.username})`,
        }));
        this.setState({ instanceOptions });
    }

    onChangeInstances = targetInstances => {
        this.setState({ targetInstances });
    };

    handleExecute = async () => {
        const { task } = this.props;
        const { targetInstances, syncParams } = this.state;

        await task({ targetInstances, syncParams });
        this.setState({ targetInstances: [], syncParams: defaultSyncParams });
    };

    handleCancel = () => {
        this.props.handleClose();
    };

    changeSyncParams = syncParams => {
        this.setState({ syncParams });
    };

    render() {
        const { d2, isOpen } = this.props;
        const { targetInstances, syncParams } = this.state;
        const disableSync = _.isEmpty(targetInstances);

        return (
            <React.Fragment>
                <ConfirmationDialog
                    isOpen={isOpen}
                    title={i18n.t("Synchronize Metadata")}
                    onSave={this.handleExecute}
                    onCancel={this.handleCancel}
                    saveText={i18n.t("Synchronize")}
                    maxWidth={"lg"}
                    fullWidth={true}
                    disableSave={disableSync}
                >
                    <DialogContent>
                        <MultiSelector
                            d2={d2}
                            height={300}
                            onChange={this.onChangeInstances}
                            options={this.state.instanceOptions}
                        />
                        <SyncParamsSelector
                            defaultParams={syncParams}
                            onChange={this.changeSyncParams}
                        />
                    </DialogContent>
                </ConfirmationDialog>
            </React.Fragment>
        );
    }
}

export default SyncDialog;
