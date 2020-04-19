#!/usr/bin/env hclang
.hc 1.0.0;

# Module Imports

. <- .com.drernie.ths.ipa;

# Declarations

Population .Seussville;
Seussville.Population .Loroid .Hortian;
Resource .R_BUCKS .R_HAIR;
Capability .C_SHOE .C_FOOD;
Value .IS_HORTONSY .LOVES_GERBIL;

# Games

.G_TERRA Game { Status LOVES_GERBIL; }

.G_TRIBE Game {
   < Loroid > ? (Loroid.Status -IS_HORTONSY);
   < Hortian > ? (Hortian.Status IS_HORTONSY);
}

.G_JOB Game {
   < Loroid > ? (R_BUCKS C_SHOE);
   < Hortian > ? (R_BUCKS C_FOOD);
}

.G_PLUTO Game { Status R_BUCKS; }
