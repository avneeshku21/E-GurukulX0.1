#!/bin/sh
set -eu

(
  while :; do
    sleep 12h
    nginx -s reload || true
  done
) &