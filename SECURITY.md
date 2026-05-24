# Security Policy

## Reporting a Vulnerability

If you find a security vulnerability in the maratool.com codebase or the
deployed site, please report it privately by emailing:

**maratool@marcell.com.br**

Please include:

- A description of the issue and its potential impact.
- Steps to reproduce, or a proof-of-concept where applicable.
- Any relevant URLs, request payloads, or screenshots.

You should receive an acknowledgement within **72 hours**. We aim to
investigate and respond with a fix or mitigation timeline within
**14 days** for high-severity issues.

Please do **not** open a public GitHub issue for security reports.

## Scope

In scope:

- The production website at `https://maratool.com`.
- The Cloudflare Worker that backs the Instagram media tool
  (`worker/` in this repository), deployed under the maratool domain.
- The source code in this repository.

Out of scope:

- Third-party services (Cloudflare, Google AdSense, external APIs the
  worker proxies). Report those directly to the relevant provider.
- Social engineering of the maintainer.
- Volumetric denial-of-service attacks.
- Reports from automated scanners with no demonstrated impact.

## Coordinated Disclosure

We follow coordinated disclosure. Please give us a reasonable window
(typically 30–90 days, depending on severity) to ship a fix before
publishing details. We are happy to credit reporters in release notes if
you would like to be acknowledged.
