CREATE TABLE "party_members" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "party_members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"source_id" varchar(100),
	"kta_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"nik" varchar(25),
	"gender" varchar(20),
	"birth_place" varchar(100),
	"birth_date" date,
	"marital_status" varchar(50),
	"nationality" varchar(50) DEFAULT 'Indonesia',
	"job" varchar(100),
	"email" varchar(255),
	"is_email_verified" boolean DEFAULT false,
	"phone" varchar(50),
	"province" varchar(100) DEFAULT 'KALIMANTAN BARAT',
	"city" varchar(100) DEFAULT 'KOTA PONTIANAK',
	"district" varchar(100),
	"subdistrict" varchar(100),
	"address" text,
	"postal_code" varchar(20),
	"position" varchar(100) DEFAULT 'regular' NOT NULL,
	"membership_status" varchar(50) DEFAULT 'Aktif',
	"org_verification_status" varchar(100) DEFAULT 'Belum Terverifikasi',
	"dpp_validation_status" varchar(100) DEFAULT 'Belum Divalidasi DPP',
	"dpp_decision_date" timestamp with time zone,
	"kpu_status_change_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_members_kta" UNIQUE("kta_number")
);
--> statement-breakpoint
CREATE INDEX "idx_party_members_district_subdistrict" ON "party_members" USING btree ("district","subdistrict");--> statement-breakpoint
CREATE INDEX "idx_party_members_position" ON "party_members" USING btree ("position");--> statement-breakpoint
CREATE INDEX "idx_party_members_nik" ON "party_members" USING btree ("nik");