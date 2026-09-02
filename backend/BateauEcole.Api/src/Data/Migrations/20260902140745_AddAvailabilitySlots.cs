using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BateauEcole.Api.src.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAvailabilitySlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "availability_slots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    instructor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_availability_slots", x => x.id);
                    table.ForeignKey(
                        name: "fk_availability_slots_instructors_instructor_id",
                        column: x => x.instructor_id,
                        principalTable: "instructors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_availability_slots_instructor_id",
                table: "availability_slots",
                column: "instructor_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "availability_slots");
        }
    }
}
