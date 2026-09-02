using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityUserContext<User, Guid>(options)
{
    public DbSet<Instructor> Instructors => Set<Instructor>();
    public DbSet<Permit> Permits => Set<Permit>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<ExamDate> ExamDates => Set<ExamDate>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasIndex(u => u.NormalizedEmail).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
            // EF Core migrations don't read C# property initializers — without
            // this, the generated column default would be false, not true.
            entity.Property(u => u.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(r => r.TokenHash).IsUnique();

            entity.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Instructor>()
            .HasOne(i => i.User)
            .WithMany()
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Permit>(entity =>
        {
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.Property(p => p.Price).HasPrecision(8, 2);
            // The school's actual catalog, seeded once via migration so every
            // environment starts with real data instead of an empty table —
            // admins can freely edit or delete these afterwards via the usual
            // CRUD endpoints, this is just the starting point.
            entity.HasData(SeedPermits());
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.Property(s => s.Type).HasConversion<string>();

            entity.HasOne(s => s.Permit)
                .WithMany()
                .HasForeignKey(s => s.PermitId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Instructor)
                .WithMany()
                .HasForeignKey(s => s.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(b => b.Status).HasConversion<string>();

            entity.HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.Session)
                .WithMany()
                .HasForeignKey(b => b.SessionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static Permit[] SeedPermits() =>
    [
        new()
        {
            Id = Guid.Parse("82275f75-b258-4ba6-a7e2-9d28dfb01a63"),
            Name = "Permis Mer Côtier",
            Slug = "permis-mer-cotier-complet",
            Description = "Dès 16 ans. Navigation de jour comme de nuit, dans la limite de 6 milles d'un abri " +
                "(11 km), sans limite de puissance ni de taille de bateau. Valable à vie, en France et à " +
                "l'international. 5h de code en salle + 3h30 de pratique (dont 2h à la barre). Inclus : " +
                "inscription (numéro OEDIPP), livre de code, livret du candidat, tests en ligne illimités, " +
                "convocation à l'examen. Tarif : 250 € + 30 € d'examen + 78 € de droits fiscaux.",
            Price = 358m,
            IncludesTheory = true,
            IncludesPractical = true,
            IsBundle = false,
        },
        new()
        {
            Id = Guid.Parse("3e1d77c2-305f-42d6-b58b-a48a8898bc6f"),
            Name = "Permis Mer Hauturier",
            Slug = "permis-mer-hauturier",
            Description = "Extension réservée aux titulaires du permis Mer option côtière. Navigation de jour " +
                "comme de nuit, sans limite de distance, de puissance ni de taille de bateau. Valable à vie, " +
                "en France et à l'international. Inclus : livre de code, cahier d'exercice, cours en vidéo, " +
                "matériel de navigation (carte, rapporteur, compas). Tarif : 235 € + 38 € de droits fiscaux.",
            Price = 273m,
            IncludesTheory = true,
            IncludesPractical = false,
            IsBundle = false,
        },
        new()
        {
            Id = Guid.Parse("14d33286-b681-457d-b198-75141ded90cc"),
            Name = "Permis Eaux Intérieures (Fluvial) — code seul",
            Slug = "permis-eaux-interieures-code-seul",
            Description = "Réservé aux titulaires d'un permis Mer. Permet de naviguer sur rivières, canaux et " +
                "lacs avec un bateau de moins de 20 m, sans limite de puissance. Valable à vie, en France et " +
                "à l'international. Inclus : livre de code, tests en ligne illimités. Tarif : 70 € + 30 € de " +
                "droits fiscaux.",
            Price = 100m,
            IncludesTheory = true,
            IncludesPractical = false,
            IsBundle = false,
        },
        new()
        {
            Id = Guid.Parse("b134c5b1-15c3-4243-820a-7eea7e851ad0"),
            Name = "Permis Mer Côtier — code seul",
            Slug = "permis-mer-cotier-code-seul",
            Description = "Réservé aux titulaires du permis Eaux Intérieures (fluvial). Le code peut se " +
                "préparer en autonomie ou avec les cours en salle. Inclus : livre de code, tests en ligne " +
                "illimités. Tarif : à partir de 70 € en autonomie (100 € tout compris) ou 120 € avec cours " +
                "en salle (150 € tout compris).",
            Price = 150m,
            IncludesTheory = true,
            IncludesPractical = false,
            IsBundle = false,
        },
        new()
        {
            Id = Guid.Parse("8fca7261-0221-4437-99b0-314bcb87ab4b"),
            Name = "Permis Côtier complet + Eaux Intérieures",
            Slug = "permis-cotier-complet-eaux-interieures",
            Description = "Permis Mer côtier (code + pratique) + code Eaux Intérieures (fluvial) en " +
                "autonomie. Tarif : 305 € + 30 € d'examen + 78 € de droits fiscaux.",
            Price = 443m,
            IncludesTheory = true,
            IncludesPractical = true,
            IsBundle = true,
        },
        new()
        {
            Id = Guid.Parse("995b4fbf-8702-4e33-8f72-383e3bc634a6"),
            Name = "Permis Côtier complet + Hauturier",
            Slug = "permis-cotier-complet-hauturier",
            Description = "Permis Mer côtier complet (code + pratique) + extension Hauturier en autonomie. " +
                "Tarif : 455 € + 30 € d'examen + 78 € + 38 € de droits fiscaux.",
            Price = 601m,
            IncludesTheory = true,
            IncludesPractical = true,
            IsBundle = true,
        },
        new()
        {
            Id = Guid.Parse("463ae33b-1607-4bad-a539-0d4e872b8fbc"),
            Name = "Permis Hauturier + Eaux Intérieures (code seul)",
            Slug = "permis-hauturier-eaux-interieures-code",
            Description = "Réservé aux titulaires du permis Mer côtier. Les deux codes en autonomie. Tarif : " +
                "285 € + 30 € d'examen + 38 € de droits fiscaux.",
            Price = 333m,
            IncludesTheory = true,
            IncludesPractical = false,
            IsBundle = true,
        },
        new()
        {
            Id = Guid.Parse("6d792daa-b670-44a8-abec-ed45bd20bfdf"),
            Name = "Les 3 permis bateau",
            Slug = "les-3-permis-bateau",
            Description = "Permis Côtier complet (code + pratique) + code Eaux Intérieures + code Hauturier, " +
                "en autonomie pour les deux extensions. Tarif : 495 € + 30 € d'examen + 78 € + 38 € de " +
                "droits fiscaux.",
            Price = 671m,
            IncludesTheory = true,
            IncludesPractical = true,
            IsBundle = true,
        },
    ];
}
