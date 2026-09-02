using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BateauEcole.Api.src.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedPermits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "permits",
                columns: new[] { "id", "description", "includes_practical", "includes_theory", "is_bundle", "name", "price", "slug" },
                values: new object[,]
                {
                    { new Guid("14d33286-b681-457d-b198-75141ded90cc"), "Réservé aux titulaires d'un permis Mer. Permet de naviguer sur rivières, canaux et lacs avec un bateau de moins de 20 m, sans limite de puissance. Valable à vie, en France et à l'international. Inclus : livre de code, tests en ligne illimités. Tarif : 70 € + 30 € de droits fiscaux.", false, true, false, "Permis Eaux Intérieures (Fluvial) — code seul", 100m, "permis-eaux-interieures-code-seul" },
                    { new Guid("3e1d77c2-305f-42d6-b58b-a48a8898bc6f"), "Extension réservée aux titulaires du permis Mer option côtière. Navigation de jour comme de nuit, sans limite de distance, de puissance ni de taille de bateau. Valable à vie, en France et à l'international. Inclus : livre de code, cahier d'exercice, cours en vidéo, matériel de navigation (carte, rapporteur, compas). Tarif : 235 € + 38 € de droits fiscaux.", false, true, false, "Permis Mer Hauturier", 273m, "permis-mer-hauturier" },
                    { new Guid("463ae33b-1607-4bad-a539-0d4e872b8fbc"), "Réservé aux titulaires du permis Mer côtier. Les deux codes en autonomie. Tarif : 285 € + 30 € d'examen + 38 € de droits fiscaux.", false, true, true, "Permis Hauturier + Eaux Intérieures (code seul)", 333m, "permis-hauturier-eaux-interieures-code" },
                    { new Guid("6d792daa-b670-44a8-abec-ed45bd20bfdf"), "Permis Côtier complet (code + pratique) + code Eaux Intérieures + code Hauturier, en autonomie pour les deux extensions. Tarif : 495 € + 30 € d'examen + 78 € + 38 € de droits fiscaux.", true, true, true, "Les 3 permis bateau", 671m, "les-3-permis-bateau" },
                    { new Guid("82275f75-b258-4ba6-a7e2-9d28dfb01a63"), "Dès 16 ans. Navigation de jour comme de nuit, dans la limite de 6 milles d'un abri (11 km), sans limite de puissance ni de taille de bateau. Valable à vie, en France et à l'international. 5h de code en salle + 3h30 de pratique (dont 2h à la barre). Inclus : inscription (numéro OEDIPP), livre de code, livret du candidat, tests en ligne illimités, convocation à l'examen. Tarif : 250 € + 30 € d'examen + 78 € de droits fiscaux.", true, true, false, "Permis Mer Côtier", 358m, "permis-mer-cotier-complet" },
                    { new Guid("8fca7261-0221-4437-99b0-314bcb87ab4b"), "Permis Mer côtier (code + pratique) + code Eaux Intérieures (fluvial) en autonomie. Tarif : 305 € + 30 € d'examen + 78 € de droits fiscaux.", true, true, true, "Permis Côtier complet + Eaux Intérieures", 443m, "permis-cotier-complet-eaux-interieures" },
                    { new Guid("995b4fbf-8702-4e33-8f72-383e3bc634a6"), "Permis Mer côtier complet (code + pratique) + extension Hauturier en autonomie. Tarif : 455 € + 30 € d'examen + 78 € + 38 € de droits fiscaux.", true, true, true, "Permis Côtier complet + Hauturier", 601m, "permis-cotier-complet-hauturier" },
                    { new Guid("b134c5b1-15c3-4243-820a-7eea7e851ad0"), "Réservé aux titulaires du permis Eaux Intérieures (fluvial). Le code peut se préparer en autonomie ou avec les cours en salle. Inclus : livre de code, tests en ligne illimités. Tarif : à partir de 70 € en autonomie (100 € tout compris) ou 120 € avec cours en salle (150 € tout compris).", false, true, false, "Permis Mer Côtier — code seul", 150m, "permis-mer-cotier-code-seul" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "permits",
                keyColumn: "id",
                keyValue: new Guid("14d33286-b681-457d-b198-75141ded90cc"));

            migrationBuilder.DeleteData(
                table: "permits",
                keyColumn: "id",
                keyValue: new Guid("3e1d77c2-305f-42d6-b58b-a48a8898bc6f"));

            migrationBuilder.DeleteData(
                table: "permits",
                keyColumn: "id",
                keyValue: new Guid("463ae33b-1607-4bad-a539-0d4e872b8fbc"));

            migrationBuilder.DeleteData(
                table: "permits",
                keyColumn: "id",
                keyValue: new Guid("6d792daa-b670-44a8-abec-ed45bd20bfdf"));

            migrationBuilder.DeleteData(
                table: "permits",
                keyColumn: "id",
                keyValue: new Guid("82275f75-b258-4ba6-a7e2-9d28dfb01a63"));

            migrationBuilder.DeleteData(
                table: "permits",
                keyColumn: "id",
                keyValue: new Guid("8fca7261-0221-4437-99b0-314bcb87ab4b"));

            migrationBuilder.DeleteData(
                table: "permits",
                keyColumn: "id",
                keyValue: new Guid("995b4fbf-8702-4e33-8f72-383e3bc634a6"));

            migrationBuilder.DeleteData(
                table: "permits",
                keyColumn: "id",
                keyValue: new Guid("b134c5b1-15c3-4243-820a-7eea7e851ad0"));
        }
    }
}
