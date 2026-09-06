Adds support for NovaDigital Zigbee wall switches (1 to 6 gang) and smart plugs to Homey, with a focus on reliable behavior and correct reporting.

Wall switches restore both their on/off state and configuration after a power outage. The backlight can be set to remain off even when power is restored. Multi-gang models correctly report the status of each individual outlet. Devices that stop responding are shown as unavailable in Homey — even before they fully leave the Zigbee network.

Smart plugs report power, current, voltage and accumulated energy, and use availability detection to avoid unnecessary polling after being unplugged.

All mains-powered devices (switches, plugs) fire a "Reconnected after power cut" flow trigger the moment they rejoin the Zigbee network. This works even for short outages that wouldn't normally trip the unavailability alarm. Use it to automate scenes like "breaker came back → turn on the lights". Detection is based on low-level firmware signals that fire only on power restore — not on periodic traffic — ensuring no false triggers. A 120-second startup delay and a 30-second cooldown provide additional protection against triggers on app restart.

A Settings page (App → Settings) shows live Zigbee traffic and rejoin statistics for every paired device, useful for spotting flaky mesh coverage or a plug that keeps power-cycling.

Supported devices:
- NovaDigital wall switches — 1, 2, 2 Touch, 3, 4, 4 ZCL and 6 gang
- NovaDigital smart plugs (with power/energy metering)
