import { useMemo } from "react";
import HeatMap from "@uiw/react-heat-map";

const DAY_MS = 24 * 60 * 60 * 1000;
const formatLocalDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseLocalDate = (date) => new Date(`${date}T00:00:00`);

// An isolated, deterministic fallback until the API supplies contribution events.
const createFallbackActivity = (startDate, days) =>
    Array.from({ length: days }, (_, index) => {
        const date = new Date(parseLocalDate(startDate).getTime() + index * DAY_MS);
        const weekday = date.getDay();
        return { date: formatLocalDate(date), count: weekday === 0 || weekday === 6 ? 0 : (index * 7 + weekday) % 5 };
    });

const getPanelColors = (maxCount) => {
    if (maxCount <= 0) return { 0: "#161b22" };
    const colors = { 0: "#161b22" };
    for (let count = 1; count <= maxCount; count += 1) {
        colors[count] = `hsl(137 55% ${24 + Math.round((count / maxCount) * 28)}%)`;
    }
    return colors;
};

const HeatMapProfile = ({ activity = [] }) => {
    const { startDate, values, panelColors } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const rangeStart = formatLocalDate(new Date(today.getTime() - 364 * DAY_MS));
        const validActivity = activity.filter(({ date, count }) =>
            /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(count) && count >= 0,
        );
        const values = validActivity.length ? validActivity : createFallbackActivity(rangeStart, 365);
        const maxCount = values.reduce((max, { count }) => Math.max(max, count), 0);
        return { startDate: parseLocalDate(rangeStart), values, panelColors: getPanelColors(maxCount) };
    }, [activity]);

    return (
        <div className="contribution-heatmap">
            <h4>Recent Contributions</h4>
            <div className="contribution-heatmap__scroll">
                <HeatMap
                    className="HeatMapProfile"
                    value={values}
                    weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
                    startDate={startDate}
                    rectSize={15}
                    space={3}
                    rectProps={{ rx: 2.5 }}
                    panelColors={panelColors}
                />
            </div>
        </div>
    );
};

export default HeatMapProfile;
