# NYC Step Map — Group 2

**Live website:** [https://nyc-step-map-group2.suyuw.chatgpt.site](https://nyc-step-map-group2.suyuw.chatgpt.site/?v=2#home)

NYC Step Map is a responsive fitness-tracking website for New Yorkers. It helps users track daily steps, see when they moved, and visualize which NYC boroughs they covered. It also turns walking activity into understandable estimates for distance, calories, avoided carbon emissions, and transportation costs.

## 1. Plan

- **Target users:** People who live, study, or work in New York City and walk as part of their daily routine.
- **Main goal:** Help a user track daily steps and understand how those steps connect to time, place, health, environmental impact, and transportation savings.
- **Key data:** Daily step goal, step entries, time of activity, NYC borough coverage, primary neighborhood, height, and weight.

## 2. Build

The interface uses components from the course interface terms cheat sheet:

- Header and navigation bar
- Progress ring and progress bars
- Cards for daily metrics and impact estimates
- Modal dialogs for onboarding, logging steps, and confirming deletion
- Text fields, number fields, time input, selects, radio buttons, checkboxes, and a toggle switch
- Filter for past records
- Toast messages for successful actions
- Empty, error, and disabled states
- Responsive hamburger menu

The website is built with HTML, CSS, and JavaScript. Data is saved in the browser with `localStorage`. The detailed NYC street map uses Leaflet and OpenStreetMap.

## 3. Test

We tested the main user flows on desktop and mobile:

| Test | Expected result | Result |
| --- | --- | --- |
| Submit onboarding without required information | Show an error and keep the form open | Passed |
| Enter a goal outside 1,000–50,000 steps | Show an error and do not save | Passed |
| Enter 0 or an invalid step count | Show an error and do not add steps | Passed |
| Cancel the step-entry dialog | Close without changing data | Passed |
| Add 500 steps at 10:30 AM | Update total steps and the morning time period | Passed |
| Select a new borough during step entry | Update borough coverage and the map | Passed |
| Open the site on a mobile-size screen | Show responsive navigation and readable cards | Passed |

## 4. Revise

Testing revealed that the original Cancel button inside the step-entry form was treated as a Submit button. We changed it to a separate button action, so users can now change their minds and close the dialog without submitting invalid data.

We also revised the first prototype by:

- Replacing the abstract borough diagram with a zoomable street map
- Adding first-time profile setup for borough, neighborhood, height, and weight
- Recording the time of each step entry
- Adding hourly and time-period step charts
- Adding personalized calorie, carbon, and transportation-cost estimates

## 5. Computational Thinking Decision

We used **decomposition** to divide one broad question — “How active was I in NYC today?” — into four smaller questions:

1. How many steps did I take?
2. When did I take them?
3. Which parts of NYC did I cover?
4. What did that walking mean for my health, cost, and carbon impact?

This decision shaped the interface into four connected views: the home summary, goal settings, past records, and today’s detailed progress dashboard. It keeps the main screen simple while still allowing users to explore more detailed information.

## Run locally

Open `dist/index.html` in a browser, or serve the `dist` folder with any static web server.

## Estimate notes

Distance, calorie, cost, and carbon results are educational estimates rather than medical, financial, or environmental measurements. The website explains its assumptions in the “How these estimates work” section.
