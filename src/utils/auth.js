/*
 * Copyright 2019-2020 Zheng Jie
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Cookies from 'js-cookie';
import Config, {RefreshTokenKey} from '@/settings';

const { TokenKey } = Config;

export function getToken() {
  return Cookies.get(TokenKey);
}

export function setToken(token, rememberMe) {
  if (rememberMe) {
    return Cookies.set(TokenKey, token, { expires: Config.tokenCookieExpires });
  }
  return Cookies.set(TokenKey, token);
}

export function removeToken() {
  return Cookies.remove(TokenKey);
}

export function setRefreshToken(refreshToken, rememberMe) {
  if (rememberMe) {
    return Cookies.set(RefreshTokenKey, refreshToken, { expires: Config.tokenCookieExpires });
  }
  return Cookies.set(RefreshTokenKey, refreshToken);
}

export function getRefreshToken() {
  return Cookies.get(RefreshTokenKey);
}

export function removeRefreshToken() {
  return Cookies.remove(RefreshTokenKey);
}