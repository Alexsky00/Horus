import { NextResponse } from "next/server";

/**
 * Erreurs OCTO.
 *
 * La spec impose un corps `{ error, errorMessage }` et — c'est contre-intuitif —
 * un `400 Bad Request` pour à peu près toute erreur métier, y compris un ID
 * inconnu (pas de 404). Seuls UNAUTHORIZED / FORBIDDEN / INTERNAL_SERVER_ERROR
 * portent leur propre code HTTP.
 *
 * Certains codes acceptent des champs additionnels renvoyant la valeur fautive
 * (ex: `productId`), ce que l'outil d'auto-certification vérifie.
 */
export type OctoErrorCode =
  | "INVALID_PRODUCT_ID"
  | "INVALID_OPTION_ID"
  | "INVALID_UNIT_ID"
  | "INVALID_AVAILABILITY_ID"
  | "INVALID_BOOKING_UUID"
  | "BAD_REQUEST"
  | "UNPROCESSABLE_ENTITY"
  | "INTERNAL_SERVER_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN";

const HTTP_STATUS: Record<OctoErrorCode, number> = {
  INVALID_PRODUCT_ID: 400,
  INVALID_OPTION_ID: 400,
  INVALID_UNIT_ID: 400,
  INVALID_AVAILABILITY_ID: 400,
  INVALID_BOOKING_UUID: 400,
  BAD_REQUEST: 400,
  UNPROCESSABLE_ENTITY: 400,
  INTERNAL_SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

export class OctoError extends Error {
  constructor(
    readonly code: OctoErrorCode,
    readonly errorMessage: string,
    readonly extra: Record<string, unknown> = {}
  ) {
    super(errorMessage);
    this.name = "OctoError";
  }
}

export function octoErrorResponse(err: OctoError): NextResponse {
  return NextResponse.json(
    { error: err.code, errorMessage: err.errorMessage, ...err.extra },
    { status: HTTP_STATUS[err.code], headers: { "Cache-Control": "no-store" } }
  );
}

/** Emballe un handler OCTO : convertit les OctoError en réponse conforme, le reste en 500. */
export function withOctoErrors(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return handler().catch((err) => {
    if (err instanceof OctoError) return octoErrorResponse(err);

    console.error("[octo] unhandled error:", err);
    return octoErrorResponse(
      new OctoError("INTERNAL_SERVER_ERROR", "An unexpected error occurred")
    );
  });
}

export const badRequest = (msg: string, extra?: Record<string, unknown>) =>
  new OctoError("BAD_REQUEST", msg, extra);

export const invalidProductId = (productId: unknown) =>
  new OctoError("INVALID_PRODUCT_ID", "The Product ID was invalid or missing", { productId });

export const invalidOptionId = (optionId: unknown) =>
  new OctoError("INVALID_OPTION_ID", "The Option ID was invalid or missing", { optionId });

export const invalidUnitId = (unitId: unknown) =>
  new OctoError("INVALID_UNIT_ID", "The Unit ID was invalid or missing", { unitId });

export const invalidAvailabilityId = (availabilityId: unknown) =>
  new OctoError("INVALID_AVAILABILITY_ID", "The Availability ID was invalid or missing", {
    availabilityId,
  });

export const invalidBookingUuid = (uuid: unknown) =>
  new OctoError("INVALID_BOOKING_UUID", "The booking uuid was invalid, missing or expired", {
    uuid,
  });

export const unprocessable = (msg: string, extra?: Record<string, unknown>) =>
  new OctoError("UNPROCESSABLE_ENTITY", msg, extra);
