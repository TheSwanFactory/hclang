#!/usr/bin/env hclang
.hc 1.0.0;

# Module Imports

. <- .com.drernie.ths.ipa;

# Declarations

.Seuss Population[.Gerbil, .Horton, .Lorax, 24 .Who];
Seuss.Who <.Hortian, .Loroid>;
Seuss.Resource .R_BUCKS .R_HAIR;
Seuss.Capability .C_SHOE .C_SEAT;
Seuss.Value .V_SHOE .V_SEAT;
Who.Value .LOVES_GERBIL .IS_HORTONSY;
Gerbil.Value .HEALTH;

# Games

Hortian.Game { R_BUCKS(Seuss.V_SEAT C_SEAT R_HAIR) };
Loroid.Game { R_BUCKS(Seuss.V_SHOE C_SHOE R_HAIR) };

Hortian.Game { Status IS_HORTONSY };
Loroid.Game { Status -IS_HORTONSY };

Hortian.Game { Status C_SEAT };
Loroid.Game { Status LOVES_GERBIL };

Who.Game { Status R_BUCKS };
Horton.Game { Status N(Hortian) };
Lorax.Game { Status N(Loroid) };
Gerbil.Game { R_HAIR(HEALTH) };

# Scenarios

.S_FIT {}
