## Overview

The idea of the exercise is to solve the following problem, we don't expect it to take longer than two hours and all the data/tools should be available. Things we're looking for are:

 - Tests, either TDD or test-after
 - Frequent git commits

 We're **not** looking for a UI!

The provided API is mildly unstable by design, but if you cannot get it to work at all, please get in touch.

You can either submit via a public repository (e.g. github/gitlab/etc.) or via zipped folder.

## Problem

A recently implemented data collection form provides an array of customer submitted housing details, you are implementing the processing which will take each house in the provided json and provide an output summary to be used in providing the customer the quote. The output should be in the form, list each house separately:

```
<Submission ID>
=========================
  Estimated Heat Loss = 
  Power Heat Loss = 
  Recommended Heat Pump = 
  Cost Breakdown
    <label>, <cost>
    <label>, <cost>
    ...
  Total Cost, including VAT = 
```

The provided API was built by a third party and somewhat strange behaviour has been reported in some cases - we are assured this will not be a problem in production.

## Steps

1. Calculate the heat loss for each property. Heat loss can be calculated using the following formula:

        floorArea (m^2) * heatingFactor * insulationFactor = heat loss (kWh)

2. Using weather data from the API and the property's design region, calculate the power heat loss of the property using the total heat loss calculated and the returned heating degree days:
        
        heat loss (kWh) / heating degree days = Power heat loss (kW)

3. Using the data in the heatPumpData.json file match a heat pump to the property using the property's calculated power heat loss and each heat pump's output capacity. Calculate the total cost for the heat pump installation - total costs should include 5% VAT.
    *Note: the Heat Pump should **not be undersized**.*


## Weather Data API

An API is available to retrieve the heating degree days for a given location:
```
https://063qqrtqth.execute-api.eu-west-2.amazonaws.com/v1/weather?location=<location>
```

You will need to provide the following API Authentication key as a header:
```
x-api-key = f661f74e-20a7-4e9f-acfc-041cfb846505
```

Example response:

```
{
    "location": {
        "location": "Borders (Boulmer)",
        "degreeDays": "2483",
        "groundTemp": "9",
        "postcode": "NE66",
        "lat": "55.424",
        "lng": "-1.583"
    }
}
```
