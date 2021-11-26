import {Button, TextView, contentView, Tab, TabFolder, Constraint, TextInput} from 'tabris';

export class App {
  private bscan = new esbarcodescanner.BarcodeScannerView({
    id: 'BSCAN'
  })

  public start() {
    contentView.append(
      <$>
        <TabFolder paging stretch selectionIndex={0} tabBarLocation='bottom'>
          <Tab id='ACCUEIL' title='Accueil'>
            <Button bottom={50} onSelect={this.showText}>Initialisation</Button>
            <TextView id='TEMP0' centerX bottom={[Constraint.prev, 20]} font={{size: 24}}/>
          </Tab>
          <Tab id='SCAN' title='Scanner' visible={false}>
            <TextInput id='MARQSC' left={10} right={[Constraint.prev, 10]} height={200} keyboard='number'/>
            <Button bottom={10} onSelect={this.startScanner}>Scanner</Button>
            <TextView id='TEMP1' centerX bottom={[Constraint.prev, 10]} font={{size: 10}} text='Partie scan a creer'/>
          </Tab>
          <Tab id='CONTENU' title='Contenu' visible={false}>
            <Button center>Lister</Button>
            <TextView id='TEMP2' centerX bottom={[Constraint.prev, 20]} font={{size: 24}} text='Partie liste a creer'/>
          </Tab>
        </TabFolder>
      </$>
    );
    this.bscan.scaleMode = 'fill';
    this.bscan.appendTo($(Tab).only('#SCAN'));
    this.bscan.top = $(TextInput).only('#MARQSC').top;
    this.bscan.width = $(TextInput).only('#MARQSC').width;
    this.bscan.height = $(TextInput).only('#MARQSC').height;
    this.bscan.on('detect', (e) => $(TextView).only('#TEMP1').text = 'Donnee : ' + e.data)
  }

  private showText = () => {
    $(TextView).only('#TEMP0').text = 'Fichier a creer !';
    $(Tab).only('#SCAN').visible = true;
  };

   private startScanner = () => { //initialise le scaner
    if (!this.bscan.active) {
      this.bscan.start(['qr']);
    }
  }

}
