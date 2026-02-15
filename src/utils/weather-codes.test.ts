import { describe, it, expect } from "vitest";
import { getWeatherInfo } from "./weather-codes";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from "lucide-react";

describe("getWeatherInfo", () => {
  it("returns Sun for clear sky (code 0)", () => {
    const info = getWeatherInfo(0);
    expect(info.icon).toBe(Sun);
    expect(info.label).toBe("Clear sky");
  });

  it("returns Cloud for overcast (code 3)", () => {
    const info = getWeatherInfo(3);
    expect(info.icon).toBe(Cloud);
    expect(info.label).toBe("Overcast");
  });

  it("returns CloudRain for moderate rain (code 63)", () => {
    const info = getWeatherInfo(63);
    expect(info.icon).toBe(CloudRain);
    expect(info.label).toBe("Moderate rain");
  });

  it("returns CloudSnow for heavy snow (code 75)", () => {
    const info = getWeatherInfo(75);
    expect(info.icon).toBe(CloudSnow);
    expect(info.label).toBe("Heavy snow");
  });

  it("returns CloudLightning for thunderstorm (code 95)", () => {
    const info = getWeatherInfo(95);
    expect(info.icon).toBe(CloudLightning);
    expect(info.label).toBe("Thunderstorm");
  });

  it("returns Cloud with Unknown for unrecognized codes", () => {
    const info = getWeatherInfo(999);
    expect(info.icon).toBe(Cloud);
    expect(info.label).toBe("Unknown");
  });
});
