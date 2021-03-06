import React from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";
import { ConfirmationDialog, ObjectsTable, withLoading, withSnackbar } from "d2-ui-components";
import { withRouter } from "react-router-dom";

import PageHeader from "../page-header/PageHeader";

import Instance from "../../models/instance";

class InstancesPage extends React.Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
        snackbar: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired,
        loading: PropTypes.object.isRequired,
    };

    static model = {
        modelValidations: {
            url: { type: "URL" },
        },
    };

    state = {
        tableKey: Math.random(),
        toDelete: null,
    };

    columns = [
        { name: "name", text: i18n.t("Server name"), sortable: true },
        { name: "url", text: i18n.t("URL endpoint"), sortable: true },
        { name: "username", text: i18n.t("Username"), sortable: true },
    ];

    detailsFields = [
        { name: "name", text: i18n.t("Server name") },
        { name: "url", text: i18n.t("URL endpoint") },
        { name: "username", text: i18n.t("Username") },
        { name: "description", text: i18n.t("Description") },
    ];

    createInstance = () => {
        this.props.history.push("/instance-configurator/new");
    };

    editInstance = instance => {
        this.props.history.push(`/instance-configurator/edit/${instance.id}`);
    };

    testConnection = async instanceData => {
        const instance = await Instance.build(instanceData);
        const connectionErrors = await instance.check();
        if (!connectionErrors.status) {
            this.props.snackbar.error(connectionErrors.error.message, {
                autoHideDuration: null,
            });
        } else {
            this.props.snackbar.success(i18n.t("Connected successfully to instance"));
        }
    };

    deleteInstance = instances => {
        this.setState({ toDelete: instances });
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
            onClick: this.editInstance,
        },
        {
            name: "delete",
            text: i18n.t("Delete"),
            multiple: true,
            onClick: this.deleteInstance,
        },
        {
            name: "testConnection",
            text: i18n.t("Test Connection"),
            multiple: false,
            onClick: this.testConnection,
            icon: "settings_input_antenna",
        },
    ];

    cancelDelete = () => {
        this.setState({ toDelete: null });
    };

    confirmDelete = async () => {
        const { loading, d2 } = this.props;
        const { toDelete } = this.state;

        loading.show(true, i18n.t("Deleting Instances"));
        const instances = toDelete.map(instanceData => new Instance(instanceData));

        const results = [];
        for (const instance of instances) {
            results.push(await instance.remove(d2));
        }

        loading.reset();
        this.setState({ tableKey: Math.random(), toDelete: null });

        if (_.some(results, ["status", false])) {
            this.props.snackbar.error(i18n.t("Failed to delete some instances"));
        } else {
            this.props.snackbar.success(
                i18n.t("Successfully deleted {{count}} instances", { count: toDelete.length })
            );
        }
    };

    backHome = () => {
        this.props.history.push("/");
    };

    render() {
        const { tableKey, toDelete } = this.state;
        const { d2 } = this.props;

        return (
            <React.Fragment>
                <ConfirmationDialog
                    isOpen={!!toDelete}
                    onSave={this.confirmDelete}
                    onCancel={this.cancelDelete}
                    title={i18n.t("Delete Instances?")}
                    description={
                        toDelete
                            ? i18n.t("Are you sure you want to delete {{count}} instances?", {
                                  count: toDelete.length,
                              })
                            : ""
                    }
                    saveText={i18n.t("Ok")}
                />
                <PageHeader title={i18n.t("Instance Configuration")} onBackClick={this.backHome} />
                <ObjectsTable
                    key={tableKey}
                    d2={d2}
                    columns={this.columns}
                    detailsFields={this.detailsFields}
                    pageSize={10}
                    actions={this.actions}
                    onButtonClick={this.createInstance}
                    list={Instance.list}
                />
            </React.Fragment>
        );
    }
}

export default withLoading(withSnackbar(withRouter(InstancesPage)));
