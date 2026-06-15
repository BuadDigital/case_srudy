"use client";

import {
  Card,
  CardBody,
  CardTitle,
  FormGroup,
  FormRow,
  Label,
  Note,
  cn,
} from "@platform/design-system";
import {
  RegField,
  RegSelect,
  RegTextarea,
} from "@platform/app-shared/registration/FormFields";
import {
  FIELD_INSPECTION_DISTRICT_STATE_OPTIONS,
  FIELD_INSPECTION_FACADE_OPTIONS,
  FIELD_INSPECTION_PROPERTY_TYPE_OPTIONS,
  type FieldInspectionDistrictState,
  type FieldInspectionFacade,
  type FieldInspectionSubmission,
  type FieldInspectionYesNoChoice,
} from "../../lib/prototype/field-inspection-data";
import { INFATH_FIELD_LABELS, INFATH_YES_NO_OPTIONS } from "../../lib/prototype/infath-field-labels";

const RADIO_GROUP = "mt-1 flex flex-wrap gap-3";
const RADIO_OPT =
  "inline-flex cursor-pointer items-center gap-1.5 text-xs text-text-2";

type Patch = Partial<
  Pick<
    FieldInspectionSubmission,
    | "inspectionDate"
    | "facade"
    | "streetWidthM"
    | "builtAreaSqm"
    | "propertyUsage"
    | "streetName"
    | "mainStreetName"
    | "mapLatitude"
    | "mapLongitude"
    | "roomCount"
    | "hallCount"
    | "unitCount"
    | "bathroomCount"
    | "propertyAgeYears"
    | "showroomCount"
    | "towerCount"
    | "wellCount"
    | "hasKitchen"
    | "hasCarEntrance"
    | "hasBasement"
    | "hasElevator"
    | "hasPool"
    | "districtState"
    | "availableServices"
    | "surroundingAmenities"
    | "propertyDescription"
    | "districtProsCons"
    | "accessRouteDescription"
    | "assetNotes"
    | "buildingFloors"
    | "basementTotalSqm"
    | "annexTotalSqm"
    | "buildingsTotalSqm"
    | "exteriorPhotosPdf"
    | "interiorPhotosPdf"
  >
>;

function YesNoRadios({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string;
  value: FieldInspectionYesNoChoice;
  disabled?: boolean;
  onChange: (v: FieldInspectionYesNoChoice) => void;
}) {
  return (
    <div className={RADIO_GROUP}>
      {INFATH_YES_NO_OPTIONS.map((opt) => (
        <label key={opt.value} className={RADIO_OPT}>
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            disabled={disabled}
            onChange={() => onChange(opt.value)}
          />{" "}
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export function FieldInspectionInfathSection({
  value,
  disabled,
  onChange,
}: {
  value: FieldInspectionSubmission;
  disabled?: boolean;
  onChange: (patch: Patch) => void;
}) {
  return (
    <Card className="mb-3 bg-surface-2 shadow-none">
      <CardBody>
        <CardTitle className="mb-3 border-b border-border pb-1.5 text-[11px] uppercase tracking-wide text-primary">
          ٦ — بيانات الرفع لإنفاذ (المعاين)
        </CardTitle>
        <Note tone="default" className="border border-border bg-surface">
          الحقول التالية تُغذّي تبويب «الرفع على إنفاذ» — أدخلها مرة واحدة هنا.
        </Note>

        <FormRow className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <RegField
            id="inf-inspection-date"
            label={INFATH_FIELD_LABELS.inspectionDate}
            type="date"
            value={value.inspectionDate}
            onChange={(v) => onChange({ inspectionDate: v })}
          />
          <RegSelect
            id="inf-facade"
            label={INFATH_FIELD_LABELS.facade}
            value={value.facade}
            disabled={disabled}
            placeholder="— اختر —"
            options={FIELD_INSPECTION_FACADE_OPTIONS}
            onChange={(v) =>
              onChange({ facade: v as FieldInspectionFacade | "" })
            }
          />
          <RegSelect
            id="inf-usage"
            label={INFATH_FIELD_LABELS.propertyUsage}
            value={value.propertyUsage}
            disabled={disabled}
            placeholder="— اختر —"
            options={FIELD_INSPECTION_PROPERTY_TYPE_OPTIONS}
            onChange={(v) => onChange({ propertyUsage: v })}
          />
        </FormRow>

        <FormRow className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <RegField
            id="inf-street-w"
            label={INFATH_FIELD_LABELS.streetWidth}
            type="number"
            value={value.streetWidthM}
            onChange={(v) => onChange({ streetWidthM: v })}
          />
          <RegField
            id="inf-built-area"
            label={INFATH_FIELD_LABELS.builtArea}
            type="number"
            value={value.builtAreaSqm}
            onChange={(v) => onChange({ builtAreaSqm: v })}
          />
          <RegField
            id="inf-street"
            label={INFATH_FIELD_LABELS.streetName}
            value={value.streetName}
            onChange={(v) => onChange({ streetName: v })}
          />
          <RegField
            id="inf-main-street"
            label={INFATH_FIELD_LABELS.mainStreet}
            value={value.mainStreetName}
            onChange={(v) => onChange({ mainStreetName: v })}
          />
        </FormRow>

        <FormRow className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <RegField
            id="inf-lat"
            label="خط العرض"
            value={value.mapLatitude}
            onChange={(v) => onChange({ mapLatitude: v })}
          />
          <RegField
            id="inf-lng"
            label="خط الطول"
            value={value.mapLongitude}
            onChange={(v) => onChange({ mapLongitude: v })}
          />
          <RegSelect
            id="inf-district-state"
            label={INFATH_FIELD_LABELS.districtState}
            value={value.districtState}
            disabled={disabled}
            placeholder="— اختر —"
            options={FIELD_INSPECTION_DISTRICT_STATE_OPTIONS}
            onChange={(v) =>
              onChange({
                districtState: v as FieldInspectionDistrictState | "",
              })
            }
          />
        </FormRow>

        <FormRow className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["roomCount", INFATH_FIELD_LABELS.roomCount],
              ["hallCount", INFATH_FIELD_LABELS.hallCount],
              ["unitCount", INFATH_FIELD_LABELS.unitCount],
              ["bathroomCount", INFATH_FIELD_LABELS.bathroomCount],
            ] as const
          ).map(([key, label]) => (
            <RegField
              key={key}
              id={`inf-${key}`}
              label={label}
              type="number"
              value={value[key]}
              onChange={(v) => onChange({ [key]: v })}
            />
          ))}
        </FormRow>

        <FormRow className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["propertyAgeYears", INFATH_FIELD_LABELS.propertyAge],
              ["showroomCount", INFATH_FIELD_LABELS.showroomCount],
              ["towerCount", INFATH_FIELD_LABELS.towerCount],
              ["wellCount", INFATH_FIELD_LABELS.wellCount],
            ] as const
          ).map(([key, label]) => (
            <RegField
              key={key}
              id={`inf-${key}`}
              label={label}
              type="number"
              value={value[key]}
              onChange={(v) => onChange({ [key]: v })}
            />
          ))}
        </FormRow>

        <FormGroup className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-text-2">
            {INFATH_FIELD_LABELS.kitchen}
          </Label>
          <YesNoRadios
            name="inf-kitchen"
            value={value.hasKitchen}
            disabled={disabled}
            onChange={(hasKitchen) => onChange({ hasKitchen })}
          />
        </FormGroup>
        <FormGroup className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-text-2">
            {INFATH_FIELD_LABELS.carEntrance}
          </Label>
          <YesNoRadios
            name="inf-car"
            value={value.hasCarEntrance}
            disabled={disabled}
            onChange={(hasCarEntrance) => onChange({ hasCarEntrance })}
          />
        </FormGroup>
        <FormGroup className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-text-2">
            {INFATH_FIELD_LABELS.hasBasement}
          </Label>
          <YesNoRadios
            name="inf-basement"
            value={value.hasBasement}
            disabled={disabled}
            onChange={(hasBasement) => onChange({ hasBasement })}
          />
        </FormGroup>
        <FormGroup className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-text-2">
            {INFATH_FIELD_LABELS.hasElevator}
          </Label>
          <YesNoRadios
            name="inf-elevator"
            value={value.hasElevator}
            disabled={disabled}
            onChange={(hasElevator) => onChange({ hasElevator })}
          />
        </FormGroup>
        <FormGroup className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-text-2">
            {INFATH_FIELD_LABELS.hasPool}
          </Label>
          <YesNoRadios
            name="inf-pool"
            value={value.hasPool}
            disabled={disabled}
            onChange={(hasPool) => onChange({ hasPool })}
          />
        </FormGroup>

        <FormRow className="grid-cols-1 sm:grid-cols-2">
          <RegField
            id="inf-services"
            label={INFATH_FIELD_LABELS.services}
            value={value.availableServices}
            placeholder="كهرباء · ماء · صرف صحي"
            onChange={(v) => onChange({ availableServices: v })}
          />
          <RegField
            id="inf-amenities"
            label={INFATH_FIELD_LABELS.amenities}
            value={value.surroundingAmenities}
            placeholder="مدارس · أسواق · طرق رئيسية"
            onChange={(v) => onChange({ surroundingAmenities: v })}
          />
        </FormRow>

        <RegTextarea
          id="inf-desc"
          label={INFATH_FIELD_LABELS.propertyDescription}
          rows={3}
          value={value.propertyDescription}
          onChange={(v) => onChange({ propertyDescription: v })}
        />
        <RegTextarea
          id="inf-pros"
          label={INFATH_FIELD_LABELS.districtProsCons}
          rows={2}
          value={value.districtProsCons}
          onChange={(v) => onChange({ districtProsCons: v })}
        />
        <RegTextarea
          id="inf-access"
          label={INFATH_FIELD_LABELS.accessRoute}
          rows={2}
          value={value.accessRouteDescription}
          onChange={(v) => onChange({ accessRouteDescription: v })}
        />
        <RegTextarea
          id="inf-asset-notes"
          label={INFATH_FIELD_LABELS.assetNotes}
          rows={2}
          value={value.assetNotes}
          onChange={(v) => onChange({ assetNotes: v })}
        />

        <CardTitle
          className={cn(
            "mb-3 mt-4 border-b border-border pb-1.5 text-[11px] uppercase tracking-wide text-primary",
          )}
        >
          مساحات المباني
        </CardTitle>
        <FormRow className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["buildingFloors", INFATH_FIELD_LABELS.buildingFloors],
              ["basementTotalSqm", INFATH_FIELD_LABELS.basementTotal],
              ["annexTotalSqm", INFATH_FIELD_LABELS.annexTotal],
              ["buildingsTotalSqm", INFATH_FIELD_LABELS.buildingsTotal],
            ] as const
          ).map(([key, label]) => (
            <RegField
              key={key}
              id={`inf-${key}`}
              label={label}
              type="number"
              value={value[key]}
              onChange={(v) => onChange({ [key]: v })}
            />
          ))}
        </FormRow>

        <FormRow className="grid-cols-1 sm:grid-cols-2">
          <RegField
            id="inf-ext-pdf"
            label={INFATH_FIELD_LABELS.exteriorPhotos}
            value={value.exteriorPhotosPdf}
            placeholder="اسم ملف PDF المجمّع"
            onChange={(v) => onChange({ exteriorPhotosPdf: v })}
          />
          <RegField
            id="inf-int-pdf"
            label={INFATH_FIELD_LABELS.interiorPhotos}
            value={value.interiorPhotosPdf}
            placeholder="اسم ملف PDF المجمّع"
            onChange={(v) => onChange({ interiorPhotosPdf: v })}
          />
        </FormRow>
      </CardBody>
    </Card>
  );
}
