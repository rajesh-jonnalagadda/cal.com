import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import qs from "qs";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";

import getAppKeysFromSlug from "../../_utils/getAppKeysFromSlug";
import getInstalledAppPath from "../../_utils/getInstalledAppPath";
import createOAuthAppCredential from "../../_utils/oauth/createOAuthAppCredential";
import { decodeOAuthState } from "../../_utils/oauth/decodeOAuthState";
import appConfig from "../config.json";

let client_id = "";
let client_secret = "";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }
  const { code } = req.query;
  if (code && typeof code !== "string") {
    res.status(400).json({ message: "`code` must be a string" });
    return;
  }
  const appKeys = await getAppKeysFromSlug(appConfig.slug || "pipedrive-crm");
  if (typeof appKeys.client_id === "string") client_id = appKeys.client_id;
  if (typeof appKeys.client_secret === "string") client_secret = appKeys.client_secret;

  if (appKeys && Object.keys(appKeys).length > 0 && (!appKeys.client_id || !appKeys.client_secret)) {
    res.redirect(`${WEBAPP_URL}/api/integrations/pipedrive-crm/setup`);
  }
  if (!client_id) return res.status(400).json({ message: "pipedrive Crm consumer key missing." });
  if (!client_secret) return res.status(400).json({ message: "pipedrive Crm consumer secret missing." });
  const url = `https://oauth.pipedrive.com/oauth/token`;
  const redirectUri = `${WEBAPP_URL}/api/integrations/pipedrive-crm/callback`;
  const formData = {
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code: code,
  };
  const pipedriveCrmTokenInfo = await axios({
    method: "post",
    url: url,
    data: qs.stringify(formData),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString("base64")}`,
    },
  });
  pipedriveCrmTokenInfo.data.accountServer = `https://oauth.pipedrive.com`;

  await createOAuthAppCredential(
    { appId: appConfig.slug, type: appConfig.type },
    pipedriveCrmTokenInfo.data,
    req
  );

  const state = decodeOAuthState(req);
  res.redirect(
    getSafeRedirectUrl(state?.returnTo) ??
      getInstalledAppPath({ variant: appConfig.variant, slug: appConfig.slug })
  );
}
