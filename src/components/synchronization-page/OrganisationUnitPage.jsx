import React from "react";
import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";
import {
    OrganisationUnitGroupModel,
    OrganisationUnitGroupSetModel,
    OrganisationUnitModel,
} from "../../models/d2Model";
import GenericSynchronizationPage from "./GenericSynchronizationPage";

export default class OrganisationUnitPage extends React.Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
    };

    models = [OrganisationUnitModel, OrganisationUnitGroupModel, OrganisationUnitGroupSetModel];

    render() {
        const { d2 } = this.props;

        const title = i18n.t("Organisation Units Synchronization");

        return <GenericSynchronizationPage d2={d2} models={this.models} title={title} />;
    }
}
