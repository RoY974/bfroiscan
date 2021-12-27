import {Button, TextView, contentView, Tab, TabFolder, Constraint, TextInput, Row, ScrollView, ImageView, Composite} from 'tabris';

export class App {
  private bscan = new esbarcodescanner.BarcodeScannerView({
    id: 'BSCAN'
  })

  public start() {
    contentView.append(
      <$>
        <TabFolder paging stretch selectionIndex={0} tabBarLocation='bottom'>
          <Tab id='ACCUEIL' title='Accueil'>
          <ImageView id='LOGO' centerX image='resources/logo.png' height={180} scaleMode='auto'/>
          <Button bottom={50} onSelect={this.showText}>Initialisation</Button>
            <TextView id='TEMP0' centerX bottom={[Constraint.prev, 20]} font={{size: 24}}/>
          </Tab>
          <Tab id='SCAN' title='Scanner' visible={false} onResize={this.scanResize}>
            <TextView id='MARQSC' left={10} right={[Constraint.prev, 10]} background='black'>Camera</TextView>
            <Row id='LIGA' stretchX top={[Constraint.prev, 2]} height={25} spacing={5}>
              <TextView id='CODART' markupEnabled font={{size: 15}}><b>CODE ARTICLE</b></TextView>
              <TextView id='DESART' markupEnabled font={{size: 10}} stretchX>LIBELLE ARTICLE</TextView>
            </Row>
            <Row id='LIGB' stretchX top={[Constraint.prev, 2]} height={45} spacing={10}>
              <Button id='BOUSCAN' onSelect={this.startScanner}>Scanner</Button>
              <TextInput id='COMPTE' stretchX padding={[5,2,2,5]} font={{size: 17}} onAccept={this.validScan} enterKeyType='done' keyboard='number' enabled={false}/>
              <Button id='ANNULER' onSelect={this.annulScan} enabled={false}>Annuler</Button>
            </Row>
            <Composite id='FAKEC' bottom={0} centerX width={20} height={70}/>
          </Tab>
          <Tab id='CONTENU' title='Contenu' visible={false}>
            <ScrollView stretchX height={250} top={[Constraint.prev, 5]} direction='vertical'>
              <TextView id='SCANLIST' top={[Constraint.prev, 5]} stretchX>CODE ARTICLE;LIBELLE ARTICLE;QTE</TextView>
            </ScrollView>
          </Tab>
        </TabFolder>
      </$>
    );
    $(TextView).only('#SCANLIST').text = $(TextView).only('#SCANLIST').text + "\n";
    $(TextInput).only('#COMPTE').height = $(Button).only('#BOUSCAN').height;
    this.bscan.scaleMode = 'fill';
    this.bscan.on('detect', (e) => this.aladetection(e));
  }

  private showText = () => {
    $(TextView).only('#TEMP0').text = 'Fichier a creer !';
    $(Tab).only('#SCAN').visible = true;
  };

  private scanResize = () => {
    //Principalement déclanché à l'apparission disparission du clavier
    $(TextView).only('#MARQSC').background = 'blue';
    $(TextView).only('#MARQSC').top = ['#SCAN', 2];
    $(TextView).only('#MARQSC').bottom = ['#FAKEC', 2];
    this.bscan.top = $(TextView).only('#MARQSC').top;
    this.bscan.bottom = $(TextView).only('#MARQSC').bottom;
    this.bscan.appendTo($(Tab).only('#SCAN'));
  }

  private startScanner = () => {
    //Prépare le champs recoltant le comptage
    $(TextInput).only('#COMPTE').enabled = true;
    $(TextInput).only('#COMPTE').focused = true;
    $(TextInput).only('#COMPTE').keepFocus = true;
    if (!this.bscan.active) { //initialise le scaner
      this.bscan.start(['qr']);
    }
  }

  private annulScan = () => {
    //Relance la recolte sans enregistrer le scan encours
    $(TextView).only('#CODART').text = "<b>CODE ARTICLE</b>";
    $(TextView).only('#DESART').text = "LIBELLE ARTICLE";
    $(Button).only('#ANNULER').enabled = false;
    $(TextInput).only('#COMPTE').text = "";
  }

  private aladetection(e: MessageEvent) { //quand une étiquette est lu par la caméra
    const decode = e.data.split('|');
    console.log(decode[4] + " " + decode[5]);
    if (!$(Button).only('#ANNULER').enabled) { //Evite des scans consécutif (par erreur)
      $(TextView).only('#CODART').text = "<b>" + decode[4] + "</b>";
      $(TextView).only('#DESART').text = decode[5];
      $(Button).only('#ANNULER').enabled = true;
      $(TextInput).only('#COMPTE').enabled = true;
    }
  }

  private validScan = () => { //quand l'utilisateur valide le comptage
    if ($(TextInput).only('#COMPTE').text !== "") { //Ne fais rien s'il n'y a pas de chiffre d'entré
      let result = $(TextView).only('#CODART').text;
      //epuration du code article du gras
      result = result.substring(3);
      result = result.substring(0, result.length - 4);
      //rajoute un bout de libellé
      result = result + ";" + $(TextView).only('#DESART').text.substring(0, 20);
      //rajoute la quantite compté
      result = result + ";" + $(TextInput).only('#COMPTE').text;
      console.log(result);
      if (!$(Tab).only('#CONTENU').visible) {
        $(Tab).only('#CONTENU').visible = true;
      }
      $(TextView).only('#SCANLIST').text = $(TextView).only('#SCANLIST').text + result + "\n";
      $(TextInput).only('#COMPTE').text = "";
      this.annulScan();
    }
  }

}
