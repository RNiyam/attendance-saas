DROP INDEX IF EXISTS "designations_org_title_uidx";--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN IF NOT EXISTS "department_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "designations_org_dept_title_uidx" ON "designations" USING btree ("organization_id","department_id","title");