import {Button, TextView, contentView, Tab, TabFolder, Constraint, TextInput, Row, Widget} from 'tabris';
import {ImageView, Composite, fs, AlertDialog, CollectionView, WidgetPanEvent} from 'tabris';

const REPERTOIRE = fs.cacheDir + '/inv';
const FICHIER = REPERTOIRE + '/scan.txt';

const items = [
  {icoda: 'CODE ART', ilib: 'LIBELLE', iqte: 'QUANTITE'},
  {icoda: 'CU245875', ilib: 'TEST LONGUEUR LIBELLE12345678912345', iqte: '15'}
];

export class App {

  private bscan = new esbarcodescanner.BarcodeScannerView({
    id: 'BSCAN'
  })

  public start() {
    contentView.append(
      <$>
        <TabFolder paging stretch selectionIndex={0} tabBarLocation='bottom'>
          <Tab id='ACCUEIL' title='Accueil'>
          <ImageView id='LOGO' centerX image='resources/logo.png' height={180} scaleMode='auto' onSwipeUp={this.wipFic}/>
          <Button bottom={50} onSelect={this.fileInit}>Initialisation</Button>
            <TextView id='INFOFIC' centerX bottom={[Constraint.prev, 20]} font={{size: 15}}/>
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
          <Tab id='CONTENU' title='Contenu'>
            <CollectionView id='SCANLIST' stretch cellHeight={64} itemCount={2} createCell={this.SLcreateCell} updateCell={SLupdateCell}/>
            <Button id='TERMINE' centerX top={[Constraint.prev, 2]} onSelect={this.goTermine}>Terminer</Button>
          </Tab>
        </TabFolder>
      </$>
    );
    $(TextInput).only('#COMPTE').height = $(Button).only('#BOUSCAN').height;
    this.bscan.scaleMode = 'fill';
    this.bscan.on('detect', (e) => this.aladetection(e));
  }

  private fileInit = () => {
    try {
      if (fs.isFile(FICHIER)) {
        void fs.readFile(FICHIER, 'utf-8').catch(ex => console.error(ex)).then((ficlu) => {
          $(TextView).only('#INFOFIC').text = 'Fichier existant : ' + ficlu + ';';
        });
      } else {
        fs.writeFile(FICHIER, 'CODE ARTICLE;LIBELLE ARTICLE;QTE', 'utf-8').catch(ex => console.error(ex));
        $(TextView).only('#INFOFIC').text = 'Fichier initialisé';
        $(Tab).only('#SCAN').visible = true;
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  private wipFic = () => {
    //Normalement a des fins de debuggage
    void fs.removeFile(FICHIER).catch(ex => console.error(ex)).then(() => {
      $(TextView).only('#INFOFIC').text = 'Fichier supprimé';
    });
  }

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
      let vart = $(TextView).only('#CODART').text;
      //epuration du code article du gras
      vart = vart.substring(3);
      vart = vart.substring(0, vart.length - 4);
      //rajoute un bout de libellé
      const vlib = $(TextView).only('#DESART').text.substring(0, 35);
      //rajoute la quantite compté
      const vqte = $(TextInput).only('#COMPTE').text;
      console.log(vart + ";" + vlib + ";" + vqte);
      if (!$(Tab).only('#CONTENU').visible) {
        $(Tab).only('#CONTENU').visible = true;
      }
      $(CollectionView).only('#SCANLIST').itemCount = items.push({icoda: vart, ilib: vlib, iqte: vqte})
      $(TextInput).only('#COMPTE').text = "";
      this.annulScan();
    }
  }

  private async goTermine() {
    //Une fois que l'opérateur fini son scan
    const buttons = {ok: 'Confirmer', cancel: 'Annuler'};
    const dialog = AlertDialog.open(
      <AlertDialog title='Cloturer et envoyer' buttons={buttons}>
        Etes vous sur de terminer la saisie et envoyer le fichier ?
      </AlertDialog>
    );
    const {button} = await dialog.onClose.promise();
    if (button === 'ok') {
      console.log(`L'utilisateur confirme`);
    }
    else {
      console.log(`Annuler et revient à la saisie`);
    }
  }

  private SLcreateCell = () => {
    //Methode qui met en forme l'ajout d'une ligne de la CollectionView
    return (
      <Composite background='gray'>
        <Composite id='container' stretch background='white' onPanHorizontal={handlePan}>
          <TextView id='lscodeart' left={16} top={8} font='medium 16px'>codeart</TextView>
          <TextView id='lslibart' left={16} bottom={8}>libart</TextView>
          <TextView id='lsqteart' right={16} top={8} font='medium 16px'>qteart</TextView>
        </Composite>
        <Composite stretchX height={1} background='#eeeeee'/>
      </Composite>
    );
  }
}

function SLupdateCell(view: Composite, index: number) {
  //Fonction qui met à jour la ligne de scan avec le contenu scanné
  const item = items[index];
  const container = view.find('#container').only();
  container.data = item;
  container.transform = {translationX: 0};
  view.find(TextView).only('#lscodeart').text = item.icoda;
  view.find(TextView).only('#lslibart').text = item.ilib;
  view.find(TextView).only('#lsqteart').text = item.iqte;
}

//////////// Bloque de code qui gère l'animation de swip pour supprimer un scan
async function handlePan(event: WidgetPanEvent<Composite>) {
  const {target, state, translationX} = event;
  target.transform = {translationX};
  if (state === 'end') {
    await handlePanFinished(event);
  }
}

async function handlePanFinished({target, velocityX, translationX}: WidgetPanEvent<Composite>) {
  const beyondCenter = Math.abs(translationX) > target.bounds.width / 2;
  const fling = Math.abs(velocityX) > 200;
  const sameDirection = direction(velocityX) === direction(translationX);
  // When swiped beyond the center, trigger dismiss if flinged in the same direction or let go.
  // Otherwise, detect a dismiss only if flinged in the same direction.
  const dismiss = beyondCenter ? (sameDirection || !fling) : (sameDirection && fling);
  if (dismiss) {
    await animateDismiss(target, translationX);
  } else {
    await animateCancel(target);
  }
}

async function animateDismiss(target: Composite<Widget>, translationX: number) {
  await target.animate({
    transform: {translationX: direction(translationX) * target.bounds.width}
  }, {
    duration: 200,
    easing: 'ease-out'
  });
  const index = items.indexOf(target.data);
  items.splice(index, 1);
  $(CollectionView).only().remove(index);
}

async function animateCancel(target: Composite<Widget>) {
  return target.animate({transform: {translationX: 0}}, {duration: 200, easing: 'ease-out'});
}

function direction(offset: number) {
  return offset ? offset < 0 ? -1 : 1 : 0;
}
///////////////Fin de bloque du code
