DROP INDEX "designations_org_title_uidx";--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN "department_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "designations_org_dept_title_uidx" ON "designations" USING btree ("organization_id","department_id","title");