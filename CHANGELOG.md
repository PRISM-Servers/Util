# 2.0.0

## Major Changes

- Moved from Util to Util.Discord
    - `GetIDFromString`
    - `IsPublicChannel`
    - `LogException`
    - `LogRejection`
    - `HandleRateLimit`
    - `GetClientConnectionInfo`
    - `HandleEvalInteract`
    - `HandleEval`
    - `SendWebhookMessage`
    - `GetUserTag`
    - `DeleteMessage`
    - `HandleShardError`
    - `HandleShardDisconnect`
    - `Privet`
    - `GetMessageResponse`
    - `FindMember`
    - `IsAdmin`
    - `Ping`

- Moved and renamed `Util.GetPRISMServer` -> `Util.Discord.GetServer`

- Moved from Util to Util.Net
    - `HOST_IP`
    - `GetExternalIP`
    - `APIrequest`
    - `requestRaw`
    - `request`
    - `GetCertExpirationDays`
    - `IPFromRequest`
    - `CleanIP`
    - `IsLocalhost`
    - `IsIPAddress`
    - `GetIPAddress`

- Renamed `Util.Time.MonthAndDayFromDate` to `YMD`

- Added `Util.Time.format`