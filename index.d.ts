import Discord = require("discord.js");
import FormData = require("form-data");

export function HandleEvalInteract(res: string, code: string, interaction: any, color?: string): void;
export function ParseArgs(input: string | string[], prefix: string, numbers_only: boolean): Record<string, string>;
export function RemoveDuplicates<T>(arr: T[]): T[];
export function IsObject(o: any): boolean;
export function IsSteamID(str: string): boolean;
export function GenerateOAuthHeader(url: string, method: HTTP_Method, body: object, consumer_key: string, consumer_secret: string, access_token: string, access_token_secret: string): string;
export function IsPublicChannel(channel: Discord.TextChannel): boolean;
export function SortByValues<T>(o: T): T;
export function Base64Encode(str: string): string;
export function ParseGameTags(o: string): GameTags;
export function ReplaceAll(str: string, search: string, replacement: string): string;
export function EscapeRegexExp(str: string): string;
export function fixedEncodeURIComponent(str: string): string;
export function LogRejection(error: Error, client: Discord.Client): void;
export function LogException(error: Error | string, client: Discord.Client): void;
export function HandleRateLimit(client: Discord.Client, data: Discord.RateLimitData): void;
export function HandleShardDisconnect(client: Discord.Client, event: CloseEvent, id: number): void;
export function HandleShardError(client: Discord.Client, error: Error, id: number): void;
export function IsLocalhost(ip: string): boolean;
export function IPFromRequest(req: Express.Request): string;
export function CleanIP(ip:string): string;
export function SaveFile(path: string, file: Object): void;
export function Ping(client: Discord.Client, msg: Discord.Message, color: Number): void;
export function IsAdmin(GuildMember: Discord.GuildMember): boolean;
export function SendWebhookMessage(message: string | Discord.MessageEmbed, url: string, avatar: string, name: string): void;
export function GetPRISMServer(client: Discord.Client): Discord.Guild;
export function IsIPAddress(str: string): boolean;
export function GetIPAddress(str: string): string;
export function GetArgsFromMessage(message: string, simple: boolean): string[];
export function joinStrArray(arr: string[], separator: string, max_length: number): string[];
export function GetLongDateFormat(num: number): string;
export function GetRandomCode(): string;
export function GetRandomNumber(max?: number): number;
export function ValidateFile(original_file: Object, new_file: Object): void;
export function LoadFile(path: string, object: Object): Object;
export function DeleteMessage(msg: Discord.Message, ms?: number): void;
export function GetIDFromString(arg: string): string;
export function GetUserTag(input: string | Discord.GuildMember | Discord.User): string;
export function FindMember(guild: Discord.Guild, name: string): Promise<Discord.Collection<string, Discord.GuildMember>>;
export function GetMessageResponse(msg: Discord.Message, time?: number, accept_args?: string[], text?: string, cleanup?: boolean): Promise<Discord.Message>;
export function Privet(msg: Discord.Message): void;
export function GetClientConnectionInfo(client: Discord.Client, skipWarning?: boolean): string;
export function HandleEval(msg: Discord.Message, res: string, color: string, alreadySent?: Discord.Message, _code?: string): void;
export function Sleep(ms: number): Promise<void>;
export function request(url: string, method: HTTP_Method, body?: string | FormData, headers?: Record<string, string>, proxy?: string, timeout?: number): Promise<Response>;
export function APIrequest(endpoint: string, method: HTTP_Method, body?: string | FormData, headers?: Record<string, string>): Promise<Response>;
export function clone<T>(object: T): T;
export function GetCertExpirationDays(host: string): Promise<number>;
export function GetExternalIP(): Promise<string>;
export function ObjectToForm<T>(object: T): FormData;
export function ObjectToUrlencoded<T>(object: T): string;
export function IsValidJSON(str: string): boolean;
export function IsValidEmail(str: string): boolean;
export function NormalizeNumber(num: number): string;
export function IncreaseFromTimespan(input: string, limited?: boolean, date?: Date): Date | string | null;

export type HTTP_Method = "GET" | "POST" | "DELETE" | "PATCH" | "PUT";

export class Time {
    public static formatDate(date: Date): string;
    public static GetTimeSpanFromMs(ms: Number, short?: boolean): string;
    public static GetHoursFromSeconds(seconds: Number): number;
    public static daysBetween(date1: Date, date2: Date, short?: boolean): string;
    public static UTC(date: string | Date): string;
    public static MonthAndDayFromDate(date?: Date, separator?: string): string;
    public static LogFormat(date?: Date): string;
    public static ShortFormat(date: Date): string;
    public static WipeDateString(date: Date): string;
}

export class Response {
    public Valid: boolean;
    public StatusCode: number;
    public StatusText: string;
    public Status: string;
    public json: object;
    public response: object;
    public body: string;
    public raw: Buffer;
    public headers: Record<string, string>;
}

declare global {
    export interface Array<T> {
        remove(item: T|T[]): boolean;
        last(): T;
    }

    export interface String {
        reverse(): string;
    }

    export interface Number {
        isDecimal(): boolean;
    }
}

export class Constants {
    public static PRISM_IP: string;
    public static NewUserRole: string;
    public static ConnectedToRustRole: string;
    public static DonatorRole: string;
    public static VeteranRole: string;
    public static BannedRole: string;
    public static PRISM_Server_ID: string;
    public static CrashesWebhook: string;
    public static MessageDeletion: string;
    public static MessageEdits: string;
    public static Mothership: string;
    public static Mothership2: string;
    public static Security: string;
    public static NameChanges: string;
    public static Redirects: string;
    public static Joining: string;
    public static ServerImages: string[];
    public static OwnerID: string;
    public static WSLogs: string;
    public static APILogs: string;
    public static RustChat1: string;
    public static RustChat2: string;
    public static RustChat3: string;
    public static BansWebhook: string;
    public static Commits: string;
    public static ZWS: string;
    public static HTTP_Codes: Record<number, string>;
    public static Ruski: string[];
}

interface IPCacheEntry {
    ip: string;
    country: string;
    country_code: string;
    block: number;
    city?: string;
    isp: string;
    lat: number;
    lon: number;
    updated_at: string;
}

interface RA_Ban {
    ip?: string;
    server_name?: string;
    reason: string;
    date: string;
    old: boolean;
}

interface APIKey {
    _id: string;
    created_at: string;
    hash: string;
    permissions: number;
    description: string;
}

interface Event {
    _id: string;
    text: string;
    date: string;
    created_at: string;
    author: {id: string, name: string};
    location: string;
    eval: string;
    repeat: string;
}

interface UserInvites {
    points: number;
    banned: boolean;
    invited_users: InvitedUser[];
}

interface InvitedUser {
    id: string;
    name: string;
    invite: string;
    date: string;
}

interface TicketInfo {
    _id: string;
    id: number;
    created_at: string;
    creator: TicketUser;
    replies: TicketReply[];
    reported?: TicketUser;
    closed?: {
        at: string;
        by: TicketUser;
        reason?: string;
    }
    server: number;
    position: number[]
}

interface TicketReply {
    content: string;
    date: string;
    replier: TicketUser;
}

interface TicketUser {
    id: string;
    name: string;
}

interface IPInfo {
    ip: string;
    countryCode: string;
    countryName: string;
    isp: string;
    block: number;
    city: string;
    lat: number;
    lon: number;
    regionName?: string;
    updated_at: Date;
}

interface SteamUserClass {
    updated_at: Date;
    user: SteamUserInfo;
    games: {appid: number, playtime: number}[];
    friends: {steamid: string, since: Date}[];
    bans: SteamUserBans;
}

interface SteamServer {
    addr: string;
    gameport: number;
    steamid: string;
    name: string;
    appid: number;
    gamedir: string;
    version: string;
    product: string;
    region: number;
    players: number;
    max_players: number;
    bots: number;
    map: string;
    secure: boolean;
    dedicated: boolean;
    os: string;
    gametype: string;
}

interface ServerInfo {
    Hostname: string;
    MaxPlayers: number;
    Players: number;
    Queued: number;
    Joining: number;
    EntityCount: number;
    GameTime: string;
    Uptime: number;
    Map: string;
    Framerate: number;
    Memory: number;
    Collections: number;
    NetworkIn: number;
    NetworkOut: number;
    Restarting: boolean;
    SaveCreatedTime: string;
    Port: number;
    GameTags: string;
    Name: string;
    Changeset: string;
    UnityVersion: string;
    NetworkProtocol: number;
}

interface PinfoClass {
    search_query: string;
    UserIDString: string;
    Name: string;
    IPAddress: string;
    ClanTag: string;
    Aliases: string[];
    LastConnection: string;
    FirstConnection: string;
    Alive: boolean;
    Sleeping: boolean;
    Connected: boolean;
    PlacedEntities: number;
    ConnectionTime: string;
    ViolationLevel: number;
    ViolationKicks: number;
    VACs: number;
    GameBans: number;
    CommunityBanned: boolean;
    TradeBanned: boolean;
    DaysSinceSteamBan: number;
    TicketReportedCount: string;
    Authed: true;
    Banned: boolean;
    FirstCountry: string;
    LastCountry: string;
    AccountDays: number;
    TotalPlayTime: number;
    server: string;
    ClientLanguage: string;
    list: {steamid: string, name: string}[];
}

interface GameTags {
    oxide?: boolean;
    modded?: boolean;
    mp?: number;
    cp?: number;
    qp?: number;
    v?: number;
    h?: string;
    st?: string;
    born?: number;
}

interface RustBan {
    _start: string;
    _end: string;
    UID: string;
    Issuer: string;
    Name: string;
    IPBanned: boolean,
    Reason: string;
    Notes: string;
    C: string;
    IPs: string[];
}

interface SteamUserInfo {
    steamid: string;
    gameid?: number;
    realname?: string;
    loccountrycode?: string;
    communityvisibilitystate: 3;
    profilestate: number;
    personaname: string;
    lastlogoff?: number;
    profileurl: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
    personastate: number;
    primaryclanid: string;
    timecreated?: Date;
    personastateflags: number;
}

interface SteamUserBans {
    CommunityBanned: boolean;
    VACBanned: boolean;
    NumberOfVACBans: number;
    DaysSinceLastBan: number;
    NumberOfGameBans: number;
    EconomyBan: string;
}

interface TagData {
    creator: string;
    text: string;
    created_at: string;
    uses: number;
}

interface Devblog {
    Blog: BlogInfo;
    Sections: Section[];
    ChangeLists: Changes[];
}

interface Changes {
    BlogId: number;
    ChangeListId: number;
    ProjectId: number;
    Created: string;
    Title: string;
    Version: string;
    Features: string[];
    Fixed: string[];
    Improvements: string[];
    Removed: string[];
    KnownIssues: string[];
}

interface Section {
    BlogSectionId: number;
    BlogId: number;
    StaffId: number;
    Title: string;
    Contents: string;
    Meta: string;
    IsHtml: boolean;
    DisplayOrder: number;
    User: Blog_User;
}

interface BlogInfo {
    BlogId: number;
    ProjectId: number;
    Created: string;
    Title: string;
    Published: boolean;
    Deleted: boolean;
    Url: string;
    Header: string;
    Summary: string;
    ThreadId: string;
    SingleAuthor: boolean;
    Tags: string;
    StaffId: number;
    User: Blog_User;
}

interface Blog_User {
    FirstName: string;
    Surname: string;
    Position: string;
    Photo: string;
    Background: string;
    Town: string;
    Country: string;
    Age: number;
    Json: string;
}