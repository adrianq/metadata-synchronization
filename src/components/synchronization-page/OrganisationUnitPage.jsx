import React from "react";
import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";
import _ from "lodash";

import {
    OrganisationUnitGroupModel,
    OrganisationUnitGroupSetModel,
    OrganisationUnitModel,
} from "../../models/d2Model";
import { getOrgUnitSubtree } from "../../logic/metadata";
import GenericSynchronizationPage from "./GenericSynchronizationPage";

export default class OrganisationUnitPage extends React.Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
    };

    state = {
        children: [],
        metadataTableKey: Math.random(),
    };

    models = [OrganisationUnitModel, OrganisationUnitGroupModel, OrganisationUnitGroupSetModel];

    clearChildren = () => this.setState({ children: [] });

    selectChildren = async selectedOUs => {
        const { d2 } = this.props;
        const children = _.flatten(
            await Promise.all(selectedOUs.map(selectedOU => getOrgUnitSubtree(d2, selectedOU.id)))
        );
        this.setState({ children, metadataTableKey: Math.random() });
    };

    actions = [
        {
            name: "details",
            text: i18n.t("Details"),
            multiple: false,
            type: "details",
        },
        {
            name: "select-children",
            text: i18n.t("Select children subtree"),
            multiple: true,
            onClick: this.selectChildren,
            icon: "done_all",
        },
    ];

    render() {
        const { d2 } = this.props;
        const { children, metadataTableKey } = this.state;

        const title = i18n.t("Organisation Units Synchronization");

        return (
            <GenericSynchronizationPage
                key={metadataTableKey}
                d2={d2}
                models={this.models}
                title={title}
                actions={this.actions}
                initialSelection={children}
                clearSelection={this.clearChildren}
            />
        );
    }
}
