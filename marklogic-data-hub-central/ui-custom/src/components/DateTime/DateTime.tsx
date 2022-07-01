import React from "react";
import "./DateTime.scss";
import { getValByConfig } from "../../util/util";
import { DateTime as dt } from "luxon";

type Props = {
  config?: any;
  data?: any;
  style?: any;
  className?: any;
};

/**
 * Component for showing date and time information.
 *
 * @component
 * @example
 * TBD
 */
const DateTime: React.FC<Props> = (props) => {

    const defaultFormat = "yyyy-MM-dd";

    let val;
    if (props.children) {
        val = props.children;
    } else {
        val = getValByConfig(props.data, props.config, true)
    }

    let formattedDateTime;
    if (props.config.from) {
        formattedDateTime = dt["from" + props.config.from](val).toFormat(props.config.format ? props.config.format : defaultFormat);
    } else {
        formattedDateTime = dt.fromISO(val).toFormat(props.config.format ? props.config.format : defaultFormat);
    }

    if (formattedDateTime && props.config?.prefix) {
        formattedDateTime = props.config?.prefix.concat(formattedDateTime);
    }

    if (formattedDateTime && props.config?.suffix) {
        formattedDateTime = formattedDateTime.concat(props.config?.suffix);
    }

    const dateTimeClassName: any = props.className ? props.className : props.config?.className ? props.config.className : "";
    const dateTimeStyle: any = props.style ? props.style : props.config?.style ? props.config.style : {};
    const dateTimeTitle: string = formattedDateTime;

    return (
        <span 
            className={dateTimeClassName ? dateTimeClassName : "DateTime"} 
            style={dateTimeStyle}
            title={dateTimeTitle}
            data-testid="dateTimeContainer" 
        >
            {formattedDateTime}
        </span>
    );
};

export default DateTime;
