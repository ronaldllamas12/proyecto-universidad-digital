import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.useRealTimers();

  globalThis.window = {
    ...globalThis.window,
    location: {
      ...globalThis.window.location,
      assign: vi.fn(),
    },
  } as unknown as Window & typeof globalThis;
});

describe("http retry/backoff policy", () => {
  it("aplica retries para errores transitorios y luego resuelve", async () => {
    vi.useFakeTimers();
    const { http } = await import("../../src/api/http");

    const cfg = { url: "/x", method: "get" } as AxiosRequestConfig & {
      __attempt?: number;
    };

    let adapterCalls = 0;
    http.defaults.adapter = async (config) => {
      adapterCalls += 1;
      config.__attempt = (config.__attempt ?? 0) + 1;

      if (config.__attempt === 1) {
        return Promise.reject({ code: "ERR_NETWORK", config });
      }

      return {
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      } as AxiosResponse;
    };

    const pending = http.request(cfg);
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(200);
    expect(adapterCalls).toBe(2);
  });

  it("no reintenta en errores 4xx (excepto 429)", async () => {
    const { http } = await import("../../src/api/http");

    let adapterCalls = 0;
    const error400 = { response: { status: 400 } };

    http.defaults.adapter = async (config) => {
      adapterCalls += 1;
      return Promise.reject({ ...error400, config });
    };

    await expect(
      http.request({ url: "/bad", method: "post" }),
    ).rejects.toMatchObject(error400);
    expect(adapterCalls).toBe(1);
  });

  it("redirige a /500 cuando el error 5xx persiste tras retries", async () => {
    vi.useFakeTimers();
    const { http } = await import("../../src/api/http");

    let adapterCalls = 0;

    http.defaults.adapter = async (config) => {
      adapterCalls += 1;
      return Promise.reject({ response: { status: 500 }, config });
    };

    const pending = http.request({ url: "/boom", method: "get" });
    // Se consume también aquí para evitar ruido de unhandled rejection en Vitest.
    pending.catch(() => undefined);
    await vi.runAllTimersAsync();
    await expect(pending).rejects.toMatchObject({ response: { status: 500 } });

    expect(adapterCalls).toBeGreaterThanOrEqual(3);
    expect(window.location.assign).toHaveBeenCalledWith("/500");
  });
});
