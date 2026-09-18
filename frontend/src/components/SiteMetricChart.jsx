import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { palette } from "../theme.js";

const axisLabelStyle = {
  color: palette.silt,
  fontSize: "12px",
  fontFamily: "IBM Plex Sans, system-ui, sans-serif",
};

const axisTitleStyle = {
  color: palette.silt,
  fontSize: "12px",
  fontFamily: "IBM Plex Sans, system-ui, sans-serif",
};

Highcharts.setOptions({
  time: {
    useUTC: false,
  },
  palette: {
    colorScheme: "light",
    colors: [palette.canopy, palette.water],
    light: {
      backgroundColor: palette.surface,
    },
  },
  chart: {
    style: {
      fontFamily: "IBM Plex Sans, system-ui, sans-serif",
    },
  },
});

export default function SiteMetricChart({
  title,
  seriesName,
  data,
  yAxisTitle,
  valueSuffix = "",
  valueDecimals = 2,
  chartType = "line",
  variant = "carbon",
}) {
  const seriesColor = variant === "biodiversity" ? palette.water : palette.canopy;

  const options = {
    chart: {
      type: chartType,
      height: 320,
      backgroundColor: palette.surface,
      plotBackgroundColor: palette.surface,
      zooming: {
        type: "x",
      },
      panning: {
        enabled: true,
        type: "x",
      },
      panKey: "shift",
    },
    title: {
      text: title,
      align: "left",
      style: {
        fontFamily: "Spectral, Georgia, serif",
        fontSize: "16px",
        fontWeight: "600",
        color: palette.bark,
      },
    },
    credits: {
      enabled: false,
    },
    xAxis: {
      type: "datetime",
      lineColor: palette.edge,
      tickColor: palette.edge,
      gridLineColor: palette.edge,
      title: {
        text: "Date",
        style: axisTitleStyle,
      },
      labels: {
        format: "{value:%b %Y}",
        style: axisLabelStyle,
      },
    },
    yAxis: {
      title: {
        text: yAxisTitle,
        style: axisTitleStyle,
      },
      min: chartType === "column" ? 0 : undefined,
      lineColor: palette.edge,
      tickColor: palette.edge,
      gridLineColor: palette.edge,
      labels: {
        style: axisLabelStyle,
      },
    },
    tooltip: {
      shared: true,
      xDateFormat: "%b %e, %Y",
      valueSuffix,
      valueDecimals,
      backgroundColor: palette.surface,
      borderColor: palette.edge,
      style: {
        color: palette.bark,
        fontSize: "13px",
      },
    },
    legend: {
      enabled: true,
      align: "left",
      verticalAlign: "bottom",
      itemStyle: {
        color: palette.bark,
        fontSize: "12px",
        fontWeight: "500",
      },
      itemHoverStyle: {
        color: palette.canopy,
      },
    },
    plotOptions: {
      series: {
        marker: {
          enabled: data.length <= 24,
          radius: 3,
          fillColor: seriesColor,
          lineColor: seriesColor,
        },
      },
      column: {
        borderRadius: 3,
        color: seriesColor,
        borderColor: seriesColor,
      },
    },
    series: [
      {
        name: seriesName,
        data,
        color: seriesColor,
        lineWidth: 2,
      },
    ],
  };

  return (
    <div className="surface p-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
      <p className="caption mt-2">
        Drag across the chart to zoom the time range. Hold Shift and drag to pan.
      </p>
    </div>
  );
}
