import i18n from "@dhis2/d2-i18n";
import { ApiContext } from "d2-api";
import {
    ConfirmationDialog,
    DatePicker,
    OldObjectsTable,
    withLoading,
    withSnackbar,
} from "d2-ui-components";
import FileSaver from "file-saver";
import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router-dom";
import Dropdown from "../../components/dropdown/Dropdown";
import PageHeader from "../../components/page-header/PageHeader";
import SharingDialog from "../../components/sharing-dialog/SharingDialog";
import SyncSummary from "../../components/sync-summary/SyncSummary";
import { AggregatedSync } from "../../logic/sync/aggregated";
import { EventsSync } from "../../logic/sync/events";
import { MetadataSync } from "../../logic/sync/metadata";
import Instance from "../../models/instance";
import SyncReport from "../../models/syncReport";
import SyncRule from "../../models/syncRule";
import { getValueForCollection } from "../../utils/d2-ui-components";
import {
    getUserInfo,
    isAppConfigurator,
    isAppExecutor,
    isGlobalAdmin,
} from "../../utils/permissions";
import { getValidationMessages } from "../../utils/validations";

const config = {
    metadata: {
        title: i18n.t("Metadata Synchronization Rules"),
        SyncClass: MetadataSync,
    },
    aggregated: {
        title: i18n.t("Aggregated Data Synchronization Rules"),
        SyncClass: AggregatedSync,
    },
    events: {
        title: i18n.t("Events Synchronization Rules"),
        SyncClass: EventsSync,
    },
};

class SyncRulesPage extends React.Component {
    static contextType = ApiContext;
    static propTypes = {
        d2: PropTypes.object.isRequired,
        snackbar: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired,
        loading: PropTypes.object.isRequired,
    };

    static model = {
        modelValidations: {
            name: { type: "TEXT" },
            description: { type: "TEXT" },
            targetInstances: { type: "COLLECTION" },
            lastExecuted: { type: "DATE" },
        },
    };

    state = {
        tableKey: Math.random(),
        toDelete: null,
        allInstances: [],
        targetInstanceFilter: "",
        enabledFilter: "",
        lastExecutedFilter: null,
        syncReport: SyncReport.create(),
        syncSummaryOpen: false,
        userInfo: {},
        globalAdmin: false,
        appConfigurator: false,
        appExecutor: false,
    };

    getTargetInstances = ruleData => {
        const { allInstances } = this.state;
        const rule = SyncRule.build(ruleData);
        return _(rule.targetInstances)
            .map(id => allInstances.find(instance => instance.id === id))
            .compact()
            .map(({ name }) => ({ name }));
    };

    getReadableFrequency = ruleData => {
        const syncRule = SyncRule.build(ruleData);
        return syncRule.longFrequency || "";
    };

    columns = [
        { name: "name", text: i18n.t("Name"), sortable: true },
        {
            name: "targetInstances",
            text: i18n.t("Destination instances"),
            sortable: false,
            getValue: ruleData =>
                this.getTargetInstances(ruleData)
                    .map(e => e.name)
                    .join(", "),
        },
        {
            name: "frequency",
            text: i18n.t("Frequency"),
            sortable: true,
            getValue: this.getReadableFrequency,
        },
        {
            name: "enabled",
            text: i18n.t("Scheduling"),
            sortable: true,
            getValue: ({ enabled }) => (enabled ? i18n.t("Enabled") : i18n.t("Disabled")),
        },
        {
            name: "lastExecuted",
            text: i18n.t("Last executed"),
            sortable: true,
        },
    ];

    detailsFields = [
        { name: "name", text: i18n.t("Name") },
        { name: "description", text: i18n.t("Description") },
        {
            name: "frequency",
            text: i18n.t("Frequency"),
            getValue: this.getReadableFrequency,
        },
        {
            name: "enabled",
            text: i18n.t("Scheduling"),
            getValue: ({ enabled }) => (enabled ? i18n.t("Enabled") : i18n.t("Disabled")),
        },
        { name: "lastExecuted", text: i18n.t("Last executed") },
        {
            name: "targetInstances",
            text: i18n.t("Destination instances"),
            getValue: ruleData => getValueForCollection(this.getTargetInstances(ruleData)),
        },
    ];

    async componentDidMount() {
        const { d2 } = this.props;
        const { objects: allInstances } = await Instance.list(d2, null, null);
        const userInfo = await getUserInfo(d2);
        const globalAdmin = await isGlobalAdmin(d2);
        const appConfigurator = await isAppConfigurator(d2);
        const appExecutor = await isAppExecutor(d2);

        this.setState({ allInstances, userInfo, globalAdmin, appConfigurator, appExecutor });
    }

    downloadJSON = async ruleData => {
        const { loading, d2 } = this.props;
        const { api } = this.context;
        const syncRule = SyncRule.build(ruleData);
        const { SyncClass } = config[syncRule.type];

        loading.show(true, "Generating JSON file");

        const sync = new SyncClass(d2, api, syncRule.toBuilder());
        const payload = await sync.buildPayload();

        const json = JSON.stringify(payload, null, 4);
        const blob = new Blob([json], { type: "application/json" });
        FileSaver.saveAs(blob, `${syncRule.type}-sync-${moment().format("YYYYMMDDHHmm")}.json`);
        loading.reset();
    };

    backHome = () => {
        this.props.history.push("/");
    };

    deleteSyncRules = rules => {
        this.setState({ toDelete: rules });
    };

    cancelDelete = () => {
        this.setState({ toDelete: null });
    };

    confirmDelete = async () => {
        const { loading, d2 } = this.props;
        const { toDelete } = this.state;

        loading.show(true, i18n.t("Deleting Sync Rules"));
        const rules = toDelete.map(data => new SyncRule(data));

        const results = [];
        for (const rule of rules) {
            results.push(await rule.remove(d2));
        }

        loading.reset();
        this.setState({ tableKey: Math.random(), toDelete: null });

        if (_.some(results, ["status", false])) {
            this.props.snackbar.error(i18n.t("Failed to delete some rules"));
        } else {
            this.props.snackbar.success(
                i18n.t("Successfully deleted {{count}} rules", { count: toDelete.length })
            );
        }
    };

    createRule = () => {
        const { history, match } = this.props;
        history.push(`/sync-rules/${match.params.type}/new`);
    };

    editRule = rule => {
        const { history, match } = this.props;
        history.push(`/sync-rules/${match.params.type}/edit/${rule.id}`);
    };

    replicateRule = data => {
        const { history, match } = this.props;
        const syncRule = SyncRule.build(data).replicate();
        history.push({ pathname: `/sync-rules/${match.params.type}/new`, state: { syncRule } });
    };

    executeRule = async ({ builder, name, id: syncRule, type = "metadata" }) => {
        const { d2, loading } = this.props;
        const { api } = this.context;
        const { SyncClass } = config[type];

        try {
            const sync = new SyncClass(d2, api, { ...builder, syncRule });
            for await (const { message, syncReport, done } of sync.execute()) {
                if (message) loading.show(true, message);
                if (syncReport) await syncReport.save(d2);
                if (done && syncReport) {
                    this.setState({ syncSummaryOpen: true, syncReport });
                }
            }
        } catch (error) {
            console.error(error);
            this.props.snackbar.error(i18n.t("Failed to execute rule {{name}}", { name }));
        }
        loading.reset();
    };

    toggleEnable = async data => {
        const { d2, snackbar } = this.props;
        const oldSyncRule = SyncRule.build(data);
        const syncRule = oldSyncRule.updateEnabled(!oldSyncRule.enabled);

        const errors = await getValidationMessages(d2, syncRule);
        if (errors.length > 0) {
            snackbar.error(errors.join("\n"), {
                autoHideDuration: null,
            });
        } else {
            await syncRule.save(d2);
            snackbar.success(i18n.t("Successfully updated sync rule"));
        }
    };

    openSharingSettings = object => {
        this.setState({
            sharingSettingsObject: {
                object,
                meta: { allowPublicAccess: true, allowExternalAccess: false },
            },
        });
    };

    closeSharingSettings = () => {
        this.setState({ sharingSettingsObject: null });
    };

    verifyUserHasAccess = (d2, data, condition = false) => {
        const { userInfo, globalAdmin } = this.state;
        if (globalAdmin) return true;

        const rules = Array.isArray(data) ? data : [data];
        for (const ruleData of rules) {
            const rule = SyncRule.build(ruleData);
            if (!rule.isVisibleToUser(userInfo, "WRITE")) return false;
        }

        return condition;
    };

    verifyUserCanEdit = (d2, data) => {
        const { appConfigurator } = this.state;
        return this.verifyUserHasAccess(d2, data, appConfigurator);
    };

    verifyUserCanEditSharingSettings = (d2, data) => {
        const { appConfigurator, appExecutor } = this.state;
        return this.verifyUserHasAccess(d2, data, appConfigurator || appExecutor);
    };

    verifyUserCanExecute = (d2, data) => {
        return this.state.appExecutor;
    };

    actions = [
        {
            name: "details",
            text: i18n.t("Details"),
            multiple: false,
            type: "details",
        },
        {
            name: "edit",
            text: i18n.t("Edit"),
            multiple: false,
            isActive: this.verifyUserCanEdit,
            onClick: this.editRule,
            isPrimary: true,
        },
        {
            name: "delete",
            text: i18n.t("Delete"),
            multiple: true,
            isActive: this.verifyUserCanEdit,
            onClick: this.deleteSyncRules,
        },
        {
            name: "execute",
            text: i18n.t("Execute"),
            multiple: false,
            isActive: this.verifyUserCanExecute,
            onClick: this.executeRule,
            icon: "settings_input_antenna",
        },
        {
            name: "download",
            text: i18n.t("Download JSON"),
            multiple: false,
            onClick: this.downloadJSON,
            icon: "cloud_download",
        },
        {
            name: "replicate",
            text: i18n.t("Replicate"),
            multiple: false,
            onClick: this.replicateRule,
            icon: "content_copy",
        },
        {
            name: "toggleEnable",
            text: i18n.t("Toggle scheduling"),
            multiple: false,
            isActive: this.verifyUserCanEdit,
            onClick: this.toggleEnable,
            icon: "timer",
        },
        {
            name: "sharingSettings",
            text: i18n.t("Sharing settings"),
            multiple: false,
            isActive: this.verifyUserCanEditSharingSettings,
            onClick: this.openSharingSettings,
            icon: "share",
        },
    ];

    closeSummary = () => this.setState({ syncSummaryOpen: false });

    changeInstanceFilter = event => this.setState({ targetInstanceFilter: event.target.value });

    changeEnabledFilter = event => this.setState({ enabledFilter: event.target.value });

    changeLastExecutedFilter = moment => this.setState({ lastExecutedFilter: moment });

    onSearchRequest = key =>
        this.props.d2.Api.getApi()
            .get("sharing/search", { key })
            .then(searchResult => searchResult);

    onSharingChanged = async (updatedAttributes, onSuccess) => {
        const sharingSettingsObject = {
            meta: this.state.sharingSettingsObject.meta,
            object: {
                ...this.state.sharingSettingsObject.object,
                ...updatedAttributes,
            },
        };

        const syncRule = SyncRule.build(sharingSettingsObject.object);
        await syncRule.save(this.props.d2);

        this.setState({ sharingSettingsObject });
        if (onSuccess) onSuccess();
    };

    renderCustomFilters = () => {
        const {
            allInstances,
            targetInstanceFilter,
            enabledFilter,
            lastExecutedFilter,
        } = this.state;
        const enabledFilterData = [
            { id: "enabled", name: i18n.t("Enabled") },
            { id: "disabled", name: i18n.t("Disabled") },
        ];

        return (
            <React.Fragment>
                <DatePicker
                    key={"date-filter"}
                    placeholder={i18n.t("Last executed date")}
                    value={lastExecutedFilter}
                    onChange={this.changeLastExecutedFilter}
                    isFilter
                />
                <Dropdown
                    key={"target-instance-filter"}
                    items={allInstances}
                    onChange={this.changeInstanceFilter}
                    value={targetInstanceFilter}
                    label={i18n.t("Destination Instance")}
                />
                <Dropdown
                    key={"enabled-filter"}
                    items={enabledFilterData}
                    onChange={this.changeEnabledFilter}
                    value={enabledFilter}
                    label={i18n.t("Scheduling")}
                />
            </React.Fragment>
        );
    };

    render() {
        const {
            tableKey,
            toDelete,
            syncSummaryOpen,
            syncReport,
            targetInstanceFilter,
            enabledFilter,
            lastExecutedFilter,
            sharingSettingsObject,
            appConfigurator,
        } = this.state;
        const { d2, match } = this.props;
        const { type } = match.params;
        const { title } = config[type];

        return (
            <React.Fragment>
                <PageHeader title={title} onBackClick={this.backHome} />
                <OldObjectsTable
                    key={tableKey}
                    d2={d2}
                    model={SyncRulesPage.model}
                    columns={this.columns}
                    detailsFields={this.detailsFields}
                    pageSize={10}
                    actions={this.actions}
                    list={SyncRule.list}
                    onButtonClick={appConfigurator ? this.createRule : null}
                    customFiltersComponent={this.renderCustomFilters}
                    customFilters={{
                        targetInstanceFilter,
                        enabledFilter,
                        lastExecutedFilter,
                        type,
                    }}
                />

                <ConfirmationDialog
                    isOpen={!!toDelete}
                    onSave={this.confirmDelete}
                    onCancel={this.cancelDelete}
                    title={i18n.t("Delete Rules?")}
                    description={
                        toDelete
                            ? i18n.t("Are you sure you want to delete {{count}} rules?", {
                                  count: toDelete.length,
                              })
                            : ""
                    }
                    saveText={i18n.t("Ok")}
                />

                <SyncSummary
                    d2={d2}
                    response={syncReport}
                    isOpen={syncSummaryOpen}
                    handleClose={this.closeSummary}
                />

                <SharingDialog
                    isOpen={!!sharingSettingsObject}
                    isDataShareable={false}
                    sharedObject={sharingSettingsObject}
                    onCancel={this.closeSharingSettings}
                    onSharingChanged={this.onSharingChanged}
                    onSearchRequest={this.onSearchRequest}
                />
            </React.Fragment>
        );
    }
}

export default withLoading(withSnackbar(withRouter(SyncRulesPage)));