import React from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";
import { withLoading } from "d2-ui-components";
import { DatePicker } from "d2-ui-components";

import GenericSynchronizationPage from "./GenericSynchronizationPage";
import DeletedObject from "../../models/deletedObjects";
import Dropdown from "../dropdown/Dropdown";

class DeletedObjectsPage extends React.Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
    };

    state = {
        filters: {
            deletedAtFilter: null,
            metadataTypeFilter: null,
        },
    };

    models = [
        {
            getInitialSorting: () => ["deletedAt", "desc"],
            getColumns: () => [
                { name: "id", text: i18n.t("Identifier"), sortable: true },
                { name: "code", text: i18n.t("Code"), sortable: true },
                { name: "klass", text: i18n.t("Metadata type"), sortable: true },
                { name: "deletedAt", text: i18n.t("Deleted date"), sortable: true },
                { name: "deletedBy", text: i18n.t("Deleted by"), sortable: true },
            ],
            getDetails: () => [
                { name: "id", text: i18n.t("Identifier") },
                { name: "code", text: i18n.t("Code") },
                { name: "klass", text: i18n.t("Metadata type") },
                { name: "deletedAt", text: i18n.t("Deleted date") },
                { name: "deletedBy", text: i18n.t("Deleted by") },
            ],
            getGroupFilterName: () => null,
            getLevelFilterName: () => null,
            getMetadataType: () => "deletedObjects",
            getD2Model: () => ({
                displayName: "Deleted Objects",
                modelValidations: {
                    deletedAt: { type: "DATE" },
                },
            }),
        },
    ];

    changeDateFilter = value => {
        const { filters } = this.state;
        this.setState({ filters: { ...filters, deletedAtFilter: value } });
    };

    changeModelName = event => {
        const { filters } = this.state;
        this.setState({
            filters: {
                ...filters,
                metadataTypeFilter: event.target.value,
            },
        });
    };

    renderCustomFilters = () => {
        const { d2 } = this.props;
        const { filters } = this.state;
        const { deletedAtFilter, metadataTypeFilter } = filters;

        const models = _(d2.models)
            .mapValues(({ javaClass, displayName }) => ({
                id: javaClass.substr(javaClass.lastIndexOf(".") + 1),
                name: displayName,
            }))
            .values()
            .uniqBy("id")
            .sortBy("name")
            .value();

        return (
            <React.Fragment>
                <DatePicker
                    key={"date-filter"}
                    placeholder={i18n.t("Deleted date")}
                    value={deletedAtFilter}
                    onChange={this.changeDateFilter}
                    isFilter
                />

                <Dropdown
                    key={"model-filter"}
                    items={models}
                    onChange={this.changeModelName}
                    value={metadataTypeFilter}
                    label={i18n.t("Metadata type")}
                />
            </React.Fragment>
        );
    };

    render() {
        const { d2 } = this.props;
        const { filters } = this.state;

        const title = i18n.t("Deleted Objects Synchronization");

        return (
            <GenericSynchronizationPage
                d2={d2}
                title={title}
                models={this.models}
                list={DeletedObject.list}
                isDelete={true}
                customFiltersComponent={this.renderCustomFilters}
                customFilters={filters}
            />
        );
    }
}

export default withLoading(DeletedObjectsPage);
