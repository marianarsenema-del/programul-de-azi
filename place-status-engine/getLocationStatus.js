      lat,
      lng,
      fromCache,
      note: "Google nu are program orar completat pentru această locație.",
    };
  }

  const utcOffsetMinutes = raw.utc_offset ?? 0;
  const now = new Date();
  const local = getLocalNow(utcOffsetMinutes, now);
  const localDateStr = localDateString(utcOffsetMinutes, now);

  const openNow = isOpenNow(raw.opening_hours.periods, utcOffsetMinutes, now);
  const special = detectSpecialDay(raw.opening_hours, raw.current_opening_hours, local.day, localDateStr);

  return {
    name: raw.name || null,
    businessStatus: raw.business_status || "OPERATIONAL",
    isOpenNow: openNow,
    weeklyScheduleText: buildWeeklyScheduleText(raw.opening_hours.periods, language),
    isSpecialDay: special.isSpecial,
    specialDayReason: special.reason,
    utcOffsetMinutes,
    formattedAddress: raw.formatted_address || null,
    formattedPhoneNumber: raw.formatted_phone_number || null,
    lat,
    lng,
    fromCache,
  };
}

module.exports = { getLocationStatus, toGoogleLang, detectSpecialDay };
