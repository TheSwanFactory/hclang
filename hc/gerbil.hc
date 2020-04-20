#!/usr/bin/env hclang
.hc 1.0.0;

# Module Imports

. <- .com.drernie.ths.ipa;

# Declarations

.Seuss Population .Gerbil .Horton .Lorax (24 .Who);
Seuss.Who <.Loroid, .Hortian>;
Seuss.Resource .R_BUCKS .R_HAIR;
Seuss.Capability .C_SHOE .C_FOOD;
Seuss.Value .V_SHOE .V_FOOD .LOVES_GERBIL .IS_HORTONSY ;

# Games

.G_TERRA Game { Status LOVES_GERBIL; }

.G_TRIBE Game {
   < Loroid > ? (Loroid.Status -IS_HORTONSY);
   < Hortian > ? (Hortian.Status IS_HORTONSY);
}

.G_JOB Game {
   < Loroid > ? R_BUCKS(Seuss.V_SHOE C_SHOE) :
   < Hortian > ? R_BUCKS(Seuss.V_FOOD C_FOOD) :
   0;
}

.G_PLUTO Game { Status R_BUCKS; }

# Scenarios

.S_FIT {}
