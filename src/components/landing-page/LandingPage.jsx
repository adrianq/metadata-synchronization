import React from "react";
import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";
import Paper from "@material-ui/core/Paper";
import FontIcon from "material-ui/FontIcon";
import { withStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import ListItem from "@material-ui/core/ListItem";
import Typography from "@material-ui/core/Typography";

const styles = () => ({
    root: {
        display: "flex",
        flexGrow: 1,
        justifyContent: "center",
    },
    listItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        "&:hover": {
            backgroundColor: "#f9f9f9",
        },
        cursor: "pointer",
        padding: 50,
    },
    container: {
        width: "90%",
        padding: 10,
    },
    item: {
        padding: 20,
    },
    title: {
        marginLeft: 10,
        color: "#000000",
    },
    icons: {
        fontSize: "70px !important",
        marginRight: 10,
    },
});

const GRID_ROW_1 = 12;
const GRID_ROW_3 = 3;
const GRID_ROW_4 = 4;

class LandingPage extends React.Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
    };

    render() {
        const { classes } = this.props;
        const items = [
            ["instance-configurator", i18n.t("Instance Configuration"), "edit", GRID_ROW_1],
            ["sync/organisationUnits", i18n.t("Organisation Units"), "sync", GRID_ROW_3],
            ["sync/dataElements", i18n.t("Data Elements"), "sync", GRID_ROW_3],
            ["sync/indicators", i18n.t("Indicators"), "sync", GRID_ROW_3],
            ["sync/validationRules", i18n.t("Validation Rules"), "sync", GRID_ROW_3],
            [
                "synchronization-rules",
                i18n.t("Synchronization Rules"),
                "playlist_add_check",
                GRID_ROW_4,
            ],
            ["sync/deleted", i18n.t("Deleted objects"), "delete", GRID_ROW_4],
            ["history", i18n.t("Synchronization History"), "history", GRID_ROW_4],
        ];
        const menuItems = items.map(([key, title, icon, xs]) => (
            <Grid item xs={xs} className={classes.item} key={key}>
                <Paper className={classes.paper}>
                    <ListItem
                        data-test={`page-${key}`}
                        component={Link}
                        to={`/${key}`}
                        className={classes.listItem}
                    >
                        <FontIcon className={`material-icons ${classes.icons}`}>{icon}</FontIcon>
                        <Typography className={classes.title} variant="h5">
                            {title}
                        </Typography>
                    </ListItem>
                </Paper>
            </Grid>
        ));

        return (
            <div className={classes.root}>
                <Grid container spacing={16} data-test="pages" className={classes.container}>
                    {menuItems}
                </Grid>
            </div>
        );
    }
}

export default withStyles(styles)(LandingPage);
