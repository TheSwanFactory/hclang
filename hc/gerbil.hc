#!/usr/bin/env hclang
.hc 1.0.0; # Version
. <- .com.drernie.ths.ipa; # Import Module

# Create Simulation

.Seuss Population[.Gerbil, .Horton, .Lorax, 24 .Who];

# Declarations

Seuss.Resource .R_BUCKS .R_HAIR;
Seuss.Value .V_EXERCISE .V_REST;
Who.Value .LOVES_GERBIL .IS_HORTONSY;
Who.Capability .C_SHOE .C_SEAT;

# Games

Who.< .Hortian, .Loroid >;

Hortian.Game { R_BUCKS(V_REST C_SEAT R_HAIR) };
Loroid.Game { R_BUCKS(V_EXERCISE C_SHOE R_HAIR) };

Hortian.Game { Status IS_HORTONSY };
Loroid.Game { Status -IS_HORTONSY };

Hortian.Game { Status C_SEAT };
Loroid.Game { Status LOVES_GERBIL };

Who.Game { Status R_BUCKS };
Horton.Game { Status N(Hortian) };
Lorax.Game { Status N(Loroid) };

# Scenarios

Gerbil.Scenario { R_HAIR(V_EXERCISE).latency 10 };
Gerbil.Scenario { R_HAIR(V_REST).latency 10 };
