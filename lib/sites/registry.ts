import { headers } from "next/headers";
import type { SiteConfig } from "../types";
import bath from "./bath";
import birmingham from "./birmingham";
import bradford from "./bradford";
import brightonHove from "./brighton-hove";
import bristol from "./bristol";
import cambridge from "./cambridge";
import canterbury from "./canterbury";
import carlisle from "./carlisle";
import chelmsford from "./chelmsford";
import chester from "./chester";
import chichester from "./chichester";
import colchester from "./colchester";
import coventry from "./coventry";
import derby from "./derby";
import doncaster from "./doncaster";
import durham from "./durham";
import ely from "./ely";
import exeter from "./exeter";
import gloucester from "./gloucester";
import hereford from "./hereford";
import kingstonUponHull from "./kingston-upon-hull";
import lancaster from "./lancaster";
import leeds from "./leeds";
import leicester from "./leicester";
import lichfield from "./lichfield";
import lincoln from "./lincoln";
import liverpool from "./liverpool";
import london from "./london";
import manchester from "./manchester";
import miltonKeynes from "./milton-keynes";
import newcastleUponTyne from "./newcastle-upon-tyne";
import norwich from "./norwich";
import nottingham from "./nottingham";
import oxford from "./oxford";
import peterborough from "./peterborough";
import plymouth from "./plymouth";
import portsmouth from "./portsmouth";
import preston from "./preston";
import ripon from "./ripon";
import salford from "./salford";
import salisbury from "./salisbury";
import sheffield from "./sheffield";
import southampton from "./southampton";
import southendOnSea from "./southend-on-sea";
import stAlbans from "./st-albans";
import stokeOnTrent from "./stoke-on-trent";
import sunderland from "./sunderland";
import truro from "./truro";
import wakefield from "./wakefield";
import wells from "./wells";
import westminster from "./westminster";
import winchester from "./winchester";
import wolverhampton from "./wolverhampton";
import worcester from "./worcester";
import york from "./york";

// One entry per live domain. To add a new city: create lib/sites/<name>.ts
// (copy an existing one and edit the values) and add one line here mapping
// its real domain to the import. Nothing else in the app needs to change.
const registry: Record<string, SiteConfig> = {
  "bathasbestosabatement.co.uk": bath,
  "birminghamasbestosabatement.co.uk": birmingham,
  "bradfordasbestosabatement.co.uk": bradford,
  "brightonasbestosabatement.co.uk": brightonHove,
  "bristolasbestosabatement.co.uk": bristol,
  "cambridgeasbestosabatement.co.uk": cambridge,
  "canterburyasbestosabatement.co.uk": canterbury,
  "carlisleasbestosabatement.co.uk": carlisle,
  "chelmsfordasbestosabatement.co.uk": chelmsford,
  "chesterasbestosabatement.co.uk": chester,
  "chichesterasbestosabatement.co.uk": chichester,
  "colchesterasbestosabatement.co.uk": colchester,
  "coventryasbestosabatement.co.uk": coventry,
  "derbyasbestosabatement.co.uk": derby,
  "doncasterasbestosabatement.co.uk": doncaster,
  "durhamasbestosabatement.co.uk": durham,
  "elyasbestosabatement.co.uk": ely,
  "exeterasbestosabatement.co.uk": exeter,
  "gloucesterasbestosabatement.co.uk": gloucester,
  "herefordasbestosabatement.co.uk": hereford,
  "kingstonuponhullasbestosabatement.co.uk": kingstonUponHull,
  "lancasterasbestosabatement.co.uk": lancaster,
  "leedsasbestosabatement.co.uk": leeds,
  "leicesterasbestosabatement.co.uk": leicester,
  "lichfieldasbestosabatement.co.uk": lichfield,
  "lincolnasbestosabatement.co.uk": lincoln,
  "liverpoolasbestosabatement.co.uk": liverpool,
  "londonasbestosabatement.co.uk": london,
  "manchesterasbestosabatement.co.uk": manchester,
  "miltonkkeynesasbestosabatement.co.uk": miltonKeynes,
  "newcastleasbestosabatement.co.uk": newcastleUponTyne,
  "norwichasbestosabatement.co.uk": norwich,
  "nottinghamasbestosabatement.co.uk": nottingham,
  "oxfordasbestosabatement.co.uk": oxford,
  "peterboroughasbestosabatement.co.uk": peterborough,
  "plymouthasbestosabatement.co.uk": plymouth,
  "portsmouthasbestosabatement.co.uk": portsmouth,
  "prestonasbestosabatement.co.uk": preston,
  "riponasbestosabatement.co.uk": ripon,
  "salfordasbestosabatement.co.uk": salford,
  "salisburyasbestosabatement.co.uk": salisbury,
  "sheffieldasbestosabatement.co.uk": sheffield,
  "southamptonasbestosabatement.co.uk": southampton,
  "southendonseaasbestosabatement.co.uk": southendOnSea,
  "stalbansasbestosabatement.co.uk": stAlbans,
  "stokeontrentasbestosabatement.co.uk": stokeOnTrent,
  "sunderlandasbestosabatement.co.uk": sunderland,
  "truroasbestosabatement.co.uk": truro,
  "wakefieldasbestosabatement.co.uk": wakefield,
  "wellsasbestosabatement.co.uk": wells,
  "westminsterasbestosabatement.co.uk": westminster,
  "winchesterasbestosabatement.co.uk": winchester,
  "wolverhamptonasbestosabatement.co.uk": wolverhampton,
  "worcesterasbestosabatement.co.uk": worcester,
  "yorkasbestosabatement.co.uk": york,
};

// Used for local dev (localhost) and as a safety net if a request arrives
// on a host that isn't registered yet.
const DEFAULT_CONFIG = bath;

function normalizeHost(host: string): string {
  return host.split(":")[0].replace(/^www\./, "").toLowerCase();
}

export function getSiteConfig(): SiteConfig {
  const host = headers().get("host") ?? "";
  return registry[normalizeHost(host)] ?? DEFAULT_CONFIG;
}

export default registry;
