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
  "asbestosabatementbath.co.uk": bath,
  "asbestosabatementbirmingham.co.uk": birmingham,
  "asbestosabatementbradford.co.uk": bradford,
  "asbestosabatementbrighton-hove.co.uk": brightonHove,
  "asbestosabatementbristol.co.uk": bristol,
  "asbestosabatementcambridge.co.uk": cambridge,
  "asbestosabatementcanterbury.co.uk": canterbury,
  "asbestosabatementcarlisle.co.uk": carlisle,
  "asbestosabatementchelmsford.co.uk": chelmsford,
  "asbestosabatementchester.co.uk": chester,
  "asbestosabatementchichester.co.uk": chichester,
  "asbestosabatementcolchester.co.uk": colchester,
  "asbestosabatementcoventry.co.uk": coventry,
  "asbestosabatementderby.co.uk": derby,
  "asbestosabatementdoncaster.co.uk": doncaster,
  "asbestosabatementdurham.co.uk": durham,
  "asbestosabatementely.co.uk": ely,
  "asbestosabatementexeter.co.uk": exeter,
  "asbestosabatementgloucester.co.uk": gloucester,
  "asbestosabatementhereford.co.uk": hereford,
  "asbestosabatementkingston-upon-hull.co.uk": kingstonUponHull,
  "asbestosabatementlancaster.co.uk": lancaster,
  "asbestosabatementleeds.co.uk": leeds,
  "asbestosabatementleicester.co.uk": leicester,
  "asbestosabatementlichfield.co.uk": lichfield,
  "asbestosabatementlincoln.co.uk": lincoln,
  "asbestosabatementliverpool.co.uk": liverpool,
  "asbestosabatementlondon.co.uk": london,
  "asbestosabatementmanchester.co.uk": manchester,
  "asbestosabatementmilton-keynes.co.uk": miltonKeynes,
  "asbestosabatementnewcastle-upon-tyne.co.uk": newcastleUponTyne,
  "asbestosabatementnorwich.co.uk": norwich,
  "asbestosabatementnottingham.co.uk": nottingham,
  "asbestosabatementoxford.co.uk": oxford,
  "asbestosabatementpeterborough.co.uk": peterborough,
  "asbestosabatementplymouth.co.uk": plymouth,
  "asbestosabatementportsmouth.co.uk": portsmouth,
  "asbestosabatementpreston.co.uk": preston,
  "asbestosabatementripon.co.uk": ripon,
  "asbestosabatementsalford.co.uk": salford,
  "asbestosabatementsalisbury.co.uk": salisbury,
  "asbestosabatementsheffield.co.uk": sheffield,
  "asbestosabatementsouthampton.co.uk": southampton,
  "asbestosabatementsouthend-on-sea.co.uk": southendOnSea,
  "asbestosabatementst-albans.co.uk": stAlbans,
  "asbestosabatementstoke-on-trent.co.uk": stokeOnTrent,
  "asbestosabatementsunderland.co.uk": sunderland,
  "asbestosabatementtruro.co.uk": truro,
  "asbestosabatementwakefield.co.uk": wakefield,
  "asbestosabatementwells.co.uk": wells,
  "asbestosabatementwestminster.co.uk": westminster,
  "asbestosabatementwinchester.co.uk": winchester,
  "asbestosabatementwolverhampton.co.uk": wolverhampton,
  "asbestosabatementworcester.co.uk": worcester,
  "asbestosabatementyork.co.uk": york,
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
