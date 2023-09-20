import querystring from 'node:querystring'
import { MAL_AUTHORIZE_URL, MAL_TOKEN_URL } from '@/common/Constants'
import { getRuntimeSecret, RuntimeSecret } from '@/common/node/RuntimeSecret'
import { OauthState } from '@/web/server/interfaces/OauthState'
import { isOauthAuthFailure } from './schemas/OauthAuthFailure'
import { isOauthTokenSuccess, OauthTokenSuccess } from './schemas/OauthTokenSuccess'

// ----------------------------------------------------------------------------
// v1 API Oauth Responses
// https://myanimelist.net/apiconfig/references/authorization
// These are returned via URL queries and should be validated for their structures
// before being parsed (to avoid hijacking attempts)
// ----------------------------------------------------------------------------

export function getOauthEndpoint(oauthState: OauthState, codeChallenge: string): string {
    const query = {
        redirect_uri: `${DEFINE.WEB_URL}/api/oauth`,
        client_id: getRuntimeSecret(RuntimeSecret.MAL_CLIENT_ID),
        response_type: 'code',
        state: encodeURIComponent(JSON.stringify(oauthState)),
        code_challenge: codeChallenge,
        code_challenge_method: 'plain',
    }

    const url = `${MAL_AUTHORIZE_URL}?${querystring.stringify(query)}`
    return url
}

export async function fetchAccessToken(authCode: string, codeChallenge: string): Promise<OauthTokenSuccess> {
    const query = {
        redirect_uri: `${DEFINE.WEB_URL}/api/oauth`,
        client_id: getRuntimeSecret(RuntimeSecret.MAL_CLIENT_ID),
        client_secret: getRuntimeSecret(RuntimeSecret.MAL_CLIENT_SECRET),
        grant_type: 'authorization_code',
        code: authCode,
        code_verifier: codeChallenge,
    }

    const res = await fetch(MAL_TOKEN_URL, {
        method: 'POST',
        body: querystring.stringify(query),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
    const malRes = await res.json() as unknown

    if (isOauthAuthFailure(malRes)) {
        throw new Error(`Failed to obtain access token (${malRes.error})`)
    }

    if (!isOauthTokenSuccess(malRes)) {
        throw new Error(`Unexpected malRes: ${JSON.stringify(malRes)}`)
    }

    return malRes
}

export async function refreshAccessToken(refreshToken: string): Promise<OauthTokenSuccess> {
    const query = {
        client_id: getRuntimeSecret(RuntimeSecret.MAL_CLIENT_ID),
        client_secret: getRuntimeSecret(RuntimeSecret.MAL_CLIENT_SECRET),
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    }

    const res = await fetch(MAL_TOKEN_URL, {
        method: 'POST',
        body: querystring.stringify(query),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
    const malRes = await res.json() as unknown

    if (isOauthAuthFailure(malRes)) {
        throw new Error(`Failed to obtain access token (${malRes.error})`)
    }

    if (!isOauthTokenSuccess(malRes)) {
        throw new Error(`Unexpected malRes: ${JSON.stringify(malRes)}`)
    }

    return malRes
}
