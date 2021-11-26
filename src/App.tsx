import {Button, TextView, contentView, Tab, TabFolder, Constraint, TextInput, Row} from 'tabris';

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
            <TextView id='MARQSC' left={10} right={[Constraint.prev, 10]} height={200} background='black'>Camera</TextView>
            <Row stretchX top={[Constraint.prev, 2]} height={25} spacing={5}>
              <TextView id='CODART' markupEnabled font={{size: 15}}><b>CODE ARTICLE</b></TextView>
              <TextView id='DESART' markupEnabled font={{size: 10}} stretchX>LIBELLE ARTICLE</TextView>
            </Row>
            <Row stretchX top={[Constraint.prev, 2]} height={45} spacing={10}>
              <Button id='BOUSCAN' onSelect={this.startScanner}>Scanner</Button>
              <TextInput id='COMPTE' stretchX enterKeyType='done' keyboard='number'/>
              <Button id='ANNULER' enabled={false}>Annuler</Button>
            </Row>
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
    this.bscan.top = $(TextView).only('#MARQSC').top;
    this.bscan.width = $(TextView).only('#MARQSC').width;
    this.bscan.height = $(TextView).only('#MARQSC').height;
    this.bscan.on('detect', (e) => this.aladetection(e))
  }

  private showText = () => {
    $(TextView).only('#TEMP0').text = 'Fichier a creer !';
    $(Tab).only('#SCAN').visible = true;
  };

  private startScanner = () => { //initialise le scaner
    $(TextInput).only('#COMPTE').focused = true;
    $(TextInput).only('#COMPTE').keepFocus = true;
    if (!this.bscan.active) {
      this.bscan.start(['qr']);
    }
  }

  private aladetection(e: MessageEvent) { //quand une étiquette est lu par la caméra
    const decode = e.data.split('|');
    $(TextView).only('#CODART').text = "<b>" + decode[4] + "</b>";
    $(TextView).only('#DESART').text = decode[5];
    $(Button).only('#ANNULER').enabled = true;
    $(TextInput).only('#COMPTE').enabled = true;
  }

}
