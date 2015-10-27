#define CARDINALITY 10
#define FACTORIAL (10*9*8*7*6*5*4*3*2)

int permuted[CARDINALITY];

// Antoine Cormeau's algorithm
void permute(int m) {
    int index;
    int i;
    int elements[10] = {0,1,2,3,4,5,6,7,8,9};
    
    for( i=0; i<CARDINALITY; i++ ){
      index = m % (CARDINALITY-i);
      m = m / (CARDINALITY-i);
      permuted[i] = elements[index];
      elements[index] = elements[CARDINALITY-i-1];
    }

    return;
}

int total = 0;
int counts[CARDINALITY][CARDINALITY];

int pairings( int x, int y ) {
  return counts[x][y];
}

int totalPairings() {
  return total;
}

void simulate(
  int booths[][2], int truths[], int truthbooths,
  int matchups[][CARDINALITY], int lights[], int ceremonies )
{
  total = 0;
  
  for( int x = 0; x < CARDINALITY; x++ )
    for( int y = 0; y < CARDINALITY; y++ )
      counts[x][y] = 0;

  for(int i=0; i<FACTORIAL; i++ ) {
    permute(i);

    int valid = 1;
    
    for( int j=0; j<truthbooths; j++ ) {
      if ((permuted[booths[j][0]] == booths[j][1]) ^ (truths[j]))
	valid = 0;
    }

    if (!valid)
      continue;
    
    for( int j=0; j<ceremonies; j++ ) {
      int matches = 0;
      
      for( int x=0; x<CARDINALITY; x++ ) {
	if (permuted[x] == matchups[j][x])
	  matches++;
      }

      if (matches != lights[j]) {
	valid = 0;
	break;
      }
    }

    if (!valid) continue;

    total++;
    
    for( int x=0; x<CARDINALITY; x++ ) {
      counts[x][ permuted[x] ]++;
    }
  }

  return;
}


